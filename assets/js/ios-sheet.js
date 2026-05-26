(function () {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const sheet = document.getElementById("iosSheet");
  const trigger = document.getElementById("iosDownload");
  if (!sheet || !trigger) return;

  if (location.hash === "#ios") {
    history.replaceState(null, "", location.pathname + location.search);
  }

  const panel = sheet.querySelector(".ios-sheet__panel");
  let isClosing = false;

  function finishClose() {
    sheet.classList.remove("is-open");
    sheet.hidden = true;
    isClosing = false;
  }

  function openSheet() {
    if (isClosing) return;
    sheet.hidden = false;
    if (prefersReducedMotion) {
      sheet.classList.add("is-open");
      return;
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        sheet.classList.add("is-open");
      });
    });
  }

  function closeSheet() {
    if (sheet.hidden || isClosing || !sheet.classList.contains("is-open")) {
      return;
    }

    if (prefersReducedMotion) {
      isClosing = true;
      finishClose();
      return;
    }

    isClosing = true;
    sheet.classList.remove("is-open");

    function onTransitionEnd(event) {
      if (event.target !== sheet || event.propertyName !== "opacity") return;
      sheet.removeEventListener("transitionend", onTransitionEnd);
      finishClose();
    }

    sheet.addEventListener("transitionend", onTransitionEnd);
    window.setTimeout(function () {
      if (!isClosing) return;
      sheet.removeEventListener("transitionend", onTransitionEnd);
      finishClose();
    }, 900);
  }

  trigger.addEventListener("click", function (event) {
    if (isIOS) return;
    event.preventDefault();
    openSheet();
  });

  sheet.addEventListener("click", closeSheet);
  panel.addEventListener("click", function (event) {
    event.stopPropagation();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && sheet.classList.contains("is-open")) {
      closeSheet();
    }
  });
})();
