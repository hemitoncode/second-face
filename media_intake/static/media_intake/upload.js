(function () {
  "use strict";

  const ALLOWED_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);
  const MAX_BYTES = 100 * 1024 * 1024;
  const MAX_DURATION_SEC = 120;
  const VIDEO_RESPONSE_TYPES = new Set([
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ]);

  const CONCEAL_FIELDS = [
    { name: "conceal_voice", label: "Voice" },
    { name: "conceal_tattoos", label: "Tattoos" },
    { name: "conceal_background", label: "Background" },
    { name: "conceal_clothing", label: "Clothing" },
    { name: "conceal_name_tags", label: "Name tags" },
    { name: "conceal_reflections", label: "Reflections" },
  ];

  const form = document.getElementById("upload-form");
  const videoInput = document.getElementById("video");
  const consentInput = document.getElementById("consent");
  const submitBtn = document.getElementById("submit-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const fileError = document.getElementById("file-error");
  const choosePanel = document.getElementById("choose-panel");
  const statusRegion = document.getElementById("status-region");
  const previewPanel = document.getElementById("preview-panel");
  const previewReminder = document.getElementById("preview-reminder");
  const resultVideo = document.getElementById("result-video");
  const downloadLink = document.getElementById("download-link");
  const startOverBtn = document.getElementById("start-over-btn");
  const failureMessage = document.getElementById("failure-message");

  let validatedFile = null;
  let objectUrl = null;
  let abortController = null;
  let lastRequestedConceal = [];

  function getCsrfToken() {
    const input = form.querySelector('input[name="csrfmiddlewaretoken"]');
    return input ? input.value : "";
  }

  function revokeObjectUrl() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  }

  function hideFailure() {
    failureMessage.hidden = true;
  }

  function showFailure() {
    hidePreview();
    failureMessage.hidden = false;
    setSending(false);
    form.classList.remove("is-disabled");
  }

  function hidePreview() {
    previewPanel.hidden = true;
    resultVideo.removeAttribute("src");
    resultVideo.load();
    downloadLink.hidden = true;
    downloadLink.removeAttribute("href");
  }

  function setSending(active) {
    if (active) {
      statusRegion.textContent =
        "Working on your video. This can take a while.";
      statusRegion.hidden = false;
      cancelBtn.hidden = false;
      submitBtn.disabled = true;
      form.classList.add("is-disabled");
      choosePanel.querySelectorAll("input, button[type='submit']").forEach(
        (el) => {
          if (el !== cancelBtn) {
            el.setAttribute("disabled", "disabled");
          }
        }
      );
      cancelBtn.removeAttribute("disabled");
    } else {
      statusRegion.textContent = "";
      statusRegion.hidden = true;
      cancelBtn.hidden = true;
      form.classList.remove("is-disabled");
      choosePanel.querySelectorAll("input, button").forEach((el) => {
        if (el.id !== "submit-btn") {
          el.removeAttribute("disabled");
        }
      });
      updateSubmitState();
    }
  }

  function updateSubmitState() {
    const canSubmit =
      validatedFile !== null && consentInput.checked && !abortController;
    submitBtn.disabled = !canSubmit;
  }

  function showFileError(message) {
    fileError.textContent = message;
    fileError.hidden = !message;
  }

  function readDuration(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";

      const cleanup = () => {
        URL.revokeObjectURL(url);
        video.removeAttribute("src");
        video.load();
      };

      video.addEventListener(
        "loadedmetadata",
        () => {
          const duration = video.duration;
          cleanup();
          if (!Number.isFinite(duration) || duration <= 0) {
            reject(new Error("duration"));
          } else {
            resolve(duration);
          }
        },
        { once: true }
      );

      video.addEventListener(
        "error",
        () => {
          cleanup();
          reject(new Error("duration"));
        },
        { once: true }
      );

      video.src = url;
    });
  }

  async function validateFile(file) {
    validatedFile = null;
    showFileError("");

    if (!file) {
      updateSubmitState();
      return;
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      showFileError("Choose an MP4, MOV, or WebM video.");
      updateSubmitState();
      return;
    }

    if (file.size > MAX_BYTES) {
      showFileError("The file is larger than 100 MB.");
      updateSubmitState();
      return;
    }

    try {
      const duration = await readDuration(file);
      if (duration > MAX_DURATION_SEC) {
        showFileError("The video is longer than 2 minutes.");
        updateSubmitState();
        return;
      }
    } catch {
      showFileError("We could not read this video. Try another file.");
      updateSubmitState();
      return;
    }

    validatedFile = file;
    updateSubmitState();
  }

  function contentTypeExtension(contentType) {
    if (contentType.includes("webm")) {
      return ".webm";
    }
    if (contentType.includes("quicktime")) {
      return ".mov";
    }
    return ".mp4";
  }

  function collectConcealSelections() {
    const requested = [];
    CONCEAL_FIELDS.forEach(({ name, label }) => {
      const box = form.querySelector(`input[name="${name}"]`);
      if (box && box.checked) {
        requested.push(label);
      }
    });
    return requested;
  }

  function buildPreviewReminder(requested) {
    let text =
      "Face replacement was requested. Before you download, watch the full video for anything that can still identify you.";
    if (requested.length > 0) {
      text +=
        " You also asked to conceal: " +
        requested.join(", ") +
        ". We cannot confirm each of those was fully applied.";
    } else {
      text +=
        " You did not ask to conceal voice, tattoos, background, clothing, name tags, or reflections.";
    }
    return text;
  }

  function appendConcealFields(formData) {
    CONCEAL_FIELDS.forEach(({ name }) => {
      const box = form.querySelector(`input[name="${name}"]`);
      formData.append(name, box && box.checked ? "true" : "false");
    });
  }

  function showPreview(blob, contentType) {
    hideFailure();
    revokeObjectUrl();
    objectUrl = URL.createObjectURL(blob);
    resultVideo.src = objectUrl;
    const ext = contentTypeExtension(contentType);
    downloadLink.href = objectUrl;
    downloadLink.download = "face-replaced" + ext;
    downloadLink.hidden = false;
    previewReminder.textContent = buildPreviewReminder(lastRequestedConceal);
    previewPanel.hidden = false;
    setSending(false);
    resultVideo.focus();
  }

  async function submitUpload(event) {
    event.preventDefault();
    hideFailure();
    hidePreview();

    if (!validatedFile || !consentInput.checked) {
      return;
    }

    lastRequestedConceal = collectConcealSelections();
    abortController = new AbortController();
    setSending(true);

    const formData = new FormData();
    formData.append("video", validatedFile);
    appendConcealFields(formData);

    try {
      const response = await fetch("/api/videos/", {
        method: "POST",
        headers: {
          "X-CSRFToken": getCsrfToken(),
        },
        body: formData,
        signal: abortController.signal,
      });

      if (!response.ok) {
        showFailure();
        return;
      }

      const contentType = (response.headers.get("Content-Type") || "")
        .split(";")[0]
        .trim()
        .toLowerCase();

      if (!VIDEO_RESPONSE_TYPES.has(contentType)) {
        showFailure();
        return;
      }

      const blob = await response.blob();
      if (!blob.size) {
        showFailure();
        return;
      }

      showPreview(blob, contentType);
    } catch (err) {
      if (err.name === "AbortError") {
        hideFailure();
        setSending(false);
      } else {
        showFailure();
      }
    } finally {
      abortController = null;
    }
  }

  function onCancel() {
    if (abortController) {
      abortController.abort();
    }
  }

  function onStartOver() {
    revokeObjectUrl();
    hidePreview();
    hideFailure();
    validatedFile = null;
    videoInput.value = "";
    consentInput.checked = false;
    form.querySelectorAll(".conceal__checkbox").forEach((box) => {
      box.checked = false;
    });
    showFileError("");
    lastRequestedConceal = [];
    updateSubmitState();
    videoInput.focus();
  }

  videoInput.addEventListener("change", () => {
    const file = videoInput.files && videoInput.files[0];
    void validateFile(file || null);
  });

  consentInput.addEventListener("change", updateSubmitState);
  form.addEventListener("submit", submitUpload);
  cancelBtn.addEventListener("click", onCancel);
  startOverBtn.addEventListener("click", onStartOver);

  window.addEventListener("pagehide", revokeObjectUrl);

  updateSubmitState();
})();