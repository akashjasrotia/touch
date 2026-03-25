document.addEventListener("DOMContentLoaded", function () {
  const hamburgerMenu = document.getElementById("hamburger-menu");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const body = document.body;

  const allPages = document.querySelectorAll(".full-page");
  const messCouponPage = document.getElementById("mess-coupon-page");
  const backFromMess = document.getElementById("back-to-dashboard-from-mess");
  const backFromPass = document.getElementById("back-to-dashboard-from-pass");

  const notificationIcon = document.querySelector(".notification-icon");
  const sidebarProfileLink = document.getElementById("sidebar-profile-link");
  const messScannerLink = document.getElementById("mess-scanner-link");
  const messScannerTile = document.getElementById("mess-scanner-tile");
  document
    .querySelectorAll(".page-header .bx-arrow-back, .page-header .bx-x")
    .forEach((btn) => {
      btn.addEventListener("click", hideAllPages);
    });
  document
    .querySelectorAll(
      ".mess-coupon-header .bx-arrow-back, .mess-coupon-header .bx-x"
    )
    .forEach((btn) => btn.addEventListener("click", hideAllPages));

  if (backFromMess) backFromMess.addEventListener("click", hideAllPages);
  if (backFromPass) backFromPass.addEventListener("click", hideAllPages);

  const sidebarSearchInput = document.getElementById("sidebar-search");
  const sidebarMenuItems = document.querySelectorAll(".sidebar-menu a");

  const alertModal = document.getElementById("alert-modal");
  const alertModalMessage = document.getElementById("alert-modal-message");
  const alertModalOkBtn = document.getElementById("alert-modal-ok-btn");

  let countdownInterval;
  let codeReader = null;
  let videoStream = null;

  hamburgerMenu.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("active");
    body.classList.toggle("sidebar-open");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    body.classList.remove("sidebar-open");
  });

  sidebarSearchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    sidebarMenuItems.forEach((item) => {
      const itemText = item.textContent.toLowerCase();
      if (itemText.includes(searchTerm)) {
        item.style.display = "flex";
      } else {
        item.style.display = "none";
      }
    });
  });

  function showCustomAlert(message) {
    alertModalMessage.textContent = message;
    alertModal.classList.remove("hidden");
  }

  function hideCustomAlert() {
    alertModal.classList.add("hidden");
  }

  alertModalOkBtn.addEventListener("click", hideCustomAlert);
  alertModal.addEventListener("click", (e) => {
    if (e.target === alertModal) {
      hideCustomAlert();
    }
  });

  function showPage(pageToShow) {
    if (sidebar.classList.contains("open")) {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
      body.classList.remove("sidebar-open");
    }
    allPages.forEach((p) => p.classList.add("hidden"));
    document.querySelector(".main-header").classList.add("hidden");
    document.querySelector(".main-content").classList.add("hidden");
    document.querySelector(".bottom-nav").classList.add("hidden");

    pageToShow.classList.remove("hidden");
  }

  function hideAllPages() {
    stopCamera();
    clearInterval(countdownInterval);

    const acceptedVideo = document.getElementById("accepted-video");
    if (acceptedVideo) {
      acceptedVideo.pause();
      acceptedVideo.currentTime = 0;
    }

    allPages.forEach((p) => p.classList.add("hidden"));
    document.querySelector(".main-header").classList.remove("hidden");
    document.querySelector(".main-content").classList.remove("hidden");
    document.querySelector(".bottom-nav").classList.remove("hidden");
  }

  notificationIcon.addEventListener("click", () =>
    showPage(document.getElementById("messages-page"))
  );
  sidebarProfileLink.addEventListener("click", () =>
    showPage(document.getElementById("profile-page"))
  );

  function handleMessScannerClick(e) {
    e.preventDefault();
    // Allow all users to access the mess scanner regardless of tokens.
    showPage(messCouponPage);
  }

  messScannerLink.addEventListener("click", handleMessScannerClick);
  messScannerTile.addEventListener("click", handleMessScannerClick);

  function stopCamera() {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      videoStream = null;
    }
    codeReader = null;
  }

  document.querySelectorAll(".meal-button").forEach((button) => {
    button.addEventListener("click", () => {
      const mealType = button.querySelector("span").textContent;
      startScanFlow(mealType);
    });
  });

  function startScanFlow(mealType) {
    showPage(document.getElementById("camera-scanner-page"));
    codeReader = new ZXingBrowser.BrowserMultiFormatReader();

    codeReader
      .decodeOnceFromVideoDevice(undefined, "video-stream")
      .then((result) => {
        if (result) {
          navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
              videoStream = stream;
            });
          console.log("Barcode detected:", result.getText());
          showLoadingAnimation(mealType);
        }
      })
      .catch((err) => {
        console.error("Camera or Scan Error:", err);
        if (err && err.name !== "NotFoundException") {
          showCustomAlert(
            "Could not start camera. Please check permissions and try again."
          );
          hideAllPages();
        }
      });
  }

  function showLoadingAnimation(mealType) {
    stopCamera();
    document.getElementById("camera-scanner-page").classList.add("hidden");
    messCouponPage.classList.remove("hidden");
    messCouponPage.classList.add("content-blurred");
    document.getElementById("loading-page").classList.remove("hidden");

    setTimeout(() => {
      document.getElementById("loading-page").classList.add("hidden");
      messCouponPage.classList.remove("content-blurred");
      messCouponPage.classList.add("hidden");
      populateAndShowMessPass(mealType);
    }, 4500);
  }

  function populateAndShowMessPass(mealType) {
    // Token deduction removed so every user can use the mess scanner.

    document.getElementById("pass-meal-type").textContent = mealType;
    const now = new Date();
    const dateOptions = { month: "short", day: "2-digit", year: "numeric" };
    document.getElementById("pass-date").textContent = now
      .toLocaleString("en-US", dateOptions)
      .replace(/,/g, "");
    const timeOptions = { hour: "2-digit", minute: "2-digit", hour12: true };
    document.getElementById("pass-time").textContent = now.toLocaleTimeString(
      "en-US",
      timeOptions
    );

    showPage(document.getElementById("mess-pass-page"));

    const acceptedVideo = document.getElementById("accepted-video");
    if (acceptedVideo) {
      acceptedVideo.loop = true;
      acceptedVideo.muted = true;
      try {
        acceptedVideo.currentTime = 0;
      } catch (e) {}
      acceptedVideo.play().catch((error) => {
        console.warn(
          "Video Autoplay Failed (user interaction may be required):",
          error
        );
      });
    }

    startCountdown();
  }

  function startCountdown() {
    clearInterval(countdownInterval);
    let seconds = 30;
    const countdownElement = document.getElementById("pass-countdown");
    countdownElement.textContent = seconds;
    countdownInterval = setInterval(() => {
      seconds--;
      countdownElement.textContent = seconds;
      if (seconds <= 0) {
        clearInterval(countdownInterval);
        countdownElement.textContent = "0";
        const currentMeal = document.getElementById("pass-meal-type").textContent;
        hideAllPages();
        startScanFlow(currentMeal);
      }
    }, 1000);
  }

  (function preventPageHorizontalPan() {
    let startX = 0;
    let startY = 0;
    let isTracking = false;

    document.addEventListener(
      "touchstart",
      function (e) {
        if (!e.touches || e.touches.length > 1) return;
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
        isTracking = true;
      },
      { passive: true }
    );

    document.addEventListener(
      "touchmove",
      function (e) {
        if (!isTracking || !e.touches || e.touches.length > 1) return;
        const t = e.touches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;

        if (Math.abs(dx) > Math.abs(dy)) {
          const insideHorizontalScroller =
            e.target &&
            e.target.closest &&
            e.target.closest(".horizontal-scroll-container");

          if (!insideHorizontalScroller) {
            e.preventDefault();
          }
        }
      },
      { passive: false }
    );

    document.addEventListener(
      "touchend",
      function () {
        isTracking = false;
      },
      { passive: true }
    );
  })();

  (function tilesGridScrollElevate() {
    const tilesGrid = document.querySelector(".tiles-grid");
    if (!tilesGrid) return;
    let ticking = false;

    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const rect = tilesGrid.getBoundingClientRect();
          const threshold = 20;
          if (
            rect.top < window.innerHeight &&
            rect.bottom > 0 &&
            window.scrollY > threshold
          ) {
            tilesGrid.classList.add("tiles-elevated");
          } else {
            tilesGrid.classList.remove("tiles-elevated");
          }
          ticking = false;
        });
      },
      { passive: true }
    );
  })();

  // --- GLOBAL USER MANAGER ---
  window.UserManager = {
    defaultData: {
      name: "Akash Jasrotia",
      pic: "images/akash.jpg",
      regNo: "12319278",
      program: "P132:B.Tech. (Computer Science and Engineering)(2023)",
      fname: "Kamal Kumar",
      mname: "Sharda rani",
      phone: "7087792964",
      email: "akashjasrotia2005@gmail.com",
      dob: "07 Feb 2005",
      section: "K23VG"
    },
    init() {
      let stored = localStorage.getItem('touchUser');
      if (!stored) this.save(this.defaultData);
      this.apply();
    },
    get() {
      try {
        return JSON.parse(localStorage.getItem('touchUser')) || this.defaultData;
      } catch(e) { return this.defaultData; }
    },
    save(data) {
      localStorage.setItem('touchUser', JSON.stringify(data));
      this.apply();
    },
    apply() {
      const data = this.get();
      
      document.querySelectorAll('.profile-name, .name, #pass-name, .profile-header-card h2, .detail-value').forEach(el => {
        if(el.classList.contains('detail-value') && el.textContent.includes('Jasrotia')) {
          el.textContent = data.name;
        } else if (!el.classList.contains('detail-value')) {
          el.textContent = data.name;
        }
      });
      document.querySelectorAll('.profile-id, #pass-reg-no').forEach(el => el.textContent = data.regNo);
      document.querySelectorAll('.profile-picture, .profile-pic, .profile-header-card img, .pass-header img, img[alt="User Profile Picture"], img[alt="Profile Pic"]').forEach(img => img.src = data.pic);
      
      document.querySelectorAll('.profile-field').forEach(field => {
        const label = field.querySelector('.field-label');
        const value = field.querySelector('.field-value');
        if (!label || !value) return;
        const text = label.textContent.trim();
        if (text === "Father's Name") {
          value.textContent = field.classList.contains('bottom-pass-field') ? `${data.fname} (${data.phone})` : data.fname;
        }
        if (text === "Mother's Name") {
          value.textContent = field.classList.contains('bottom-pass-field') ? `${data.mname} ()` : data.mname;
        }
        if (text === "Contact No.") value.textContent = data.phone;
        if (text === "Email") value.textContent = data.email;
        if (text === "Date of Birth") value.textContent = data.dob;
        if (text === "Section") value.textContent = data.section;
        if (text === "Program" || text === "Session") value.textContent = data.program;
      });

      document.querySelectorAll('.detail').forEach(detail => {
        const label = detail.querySelector('.detail-label');
        if (!label) return;
        const text = label.textContent.trim();
        let textNode = Array.from(detail.childNodes).find(n => n.nodeType === 3 && n.textContent.trim().length > 0);
        if (textNode) {
          if (text === "Father's Name") textNode.textContent = ` ${data.fname} ` + (textNode.textContent.match(/\(.*\)/) || [''])[0];
          if (text === "Mother's Name") textNode.textContent = ` ${data.mname} ` + (textNode.textContent.match(/\(.*\)/) || [''])[0];
          if (text === "Program Name") textNode.textContent = ` ${data.program}`;
        }
      });
    }
  };

  UserManager.init();

});

// --- PWA SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed:', err));
  });
}
