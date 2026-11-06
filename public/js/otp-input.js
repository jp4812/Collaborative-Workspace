/**
 * Nexus Reusable 6-Box OTP Input Component
 * Accessible, keyboard friendly, paste-enabled with auto-submit and countdown timer.
 */

(function (window) {
  'use strict';

  function maskEmail(email) {
    if (!email || !email.includes('@')) return email || '';
    const [userPart, domainPart] = email.split('@');
    if (userPart.length <= 1) {
      return `${userPart}***@${domainPart}`;
    }
    return `${userPart[0]}***@${domainPart}`;
  }

  class OtpInput {
    /**
     * @param {HTMLElement|string} container
     * @param {Object} options
     * @param {Function} [options.onComplete] - Callback when all 6 digits are entered: (code) => {}
     * @param {Function} [options.onChange] - Callback on digit change: (code, isComplete) => {}
     * @param {HTMLElement|string} [options.errorElement] - Sibling/child error message element
     * @param {HTMLElement|string} [options.resendButton] - Resend button element
     * @param {Function} [options.onResend] - Callback when resend is clicked
     * @param {number} [options.resendCooldown=60] - Initial cooldown in seconds
     */
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this.container) {
        throw new Error('OtpInput: container element not found.');
      }

      this.options = Object.assign({
        onComplete: null,
        onChange: null,
        errorElement: null,
        resendButton: null,
        onResend: null,
        resendCooldown: 60
      }, options);

      this.inputs = [];
      this.timerInterval = null;
      this.remainingCooldown = 0;

      this._initErrorElement();
      this._initResendButton();
      this._render();
      this._bindEvents();
    }

    _initErrorElement() {
      if (this.options.errorElement) {
        this.errorEl = typeof this.options.errorElement === 'string'
          ? document.querySelector(this.options.errorElement)
          : this.options.errorElement;
      } else {
        this.errorEl = this.container.querySelector('.nx-error');
      }
    }

    _initResendButton() {
      if (this.options.resendButton) {
        this.resendBtn = typeof this.options.resendButton === 'string'
          ? document.querySelector(this.options.resendButton)
          : this.options.resendButton;

        if (this.resendBtn && this.options.onResend) {
          this.resendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.remainingCooldown <= 0) {
              this.options.onResend();
            }
          });
        }
      }
    }

    _render() {
      this.container.innerHTML = '';
      this.container.setAttribute('role', 'group');
      this.container.setAttribute('aria-label', '6-digit verification code');
      this.container.classList.add('flex', 'items-center', 'justify-center', 'gap-2', 'sm:gap-3');

      this.inputs = [];

      for (let i = 0; i < 6; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'numeric';
        input.pattern = '[0-9]*';
        input.maxLength = 1;
        input.dataset.index = i;
        input.setAttribute('aria-label', `Digit ${i + 1} of 6`);
        input.autocomplete = i === 0 ? 'one-time-code' : 'off';
        input.spellcheck = false;

        input.className = 'nx-otp-digit h-13 w-11 sm:h-14 sm:w-12 text-center font-display text-2xl font-bold rounded-xl border border-slate-300 bg-white text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15 select-all shadow-sm';

        this.container.appendChild(input);
        this.inputs.push(input);
      }
    }

    _bindEvents() {
      this.inputs.forEach((input, index) => {
        // Handle Input
        input.addEventListener('input', (e) => {
          this.clearError();
          const val = input.value.replace(/[^0-9]/g, '');

          if (val.length > 1) {
            // If multiple digits (autofill), distribute them
            this._distributeValue(val, index);
            return;
          }

          input.value = val;

          if (val && index < 5) {
            this.inputs[index + 1].focus();
            this.inputs[index + 1].select();
          }

          this._handleValueChange();
        });

        // Handle Keydown (Backspace & Arrow Navigation)
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace') {
            if (!input.value && index > 0) {
              e.preventDefault();
              this.inputs[index - 1].focus();
              this.inputs[index - 1].value = '';
              this._handleValueChange();
            }
          } else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            this.inputs[index - 1].focus();
            this.inputs[index - 1].select();
          } else if (e.key === 'ArrowRight' && index < 5) {
            e.preventDefault();
            this.inputs[index + 1].focus();
            this.inputs[index + 1].select();
          }
        });

        // Handle Paste
        input.addEventListener('paste', (e) => {
          e.preventDefault();
          const pasteData = (e.clipboardData || window.clipboardData).getData('text');
          const cleanDigits = pasteData.replace(/[^0-9]/g, '');
          if (cleanDigits) {
            this._distributeValue(cleanDigits, 0);
          }
        });

        // Click selects contents for quick replacement
        input.addEventListener('click', () => {
          input.select();
        });
      });
    }

    _distributeValue(digits, startIndex = 0) {
      const chars = digits.slice(0, 6 - startIndex).split('');
      chars.forEach((char, i) => {
        const targetIdx = startIndex + i;
        if (targetIdx < 6) {
          this.inputs[targetIdx].value = char;
        }
      });

      const nextFocus = Math.min(startIndex + chars.length, 5);
      this.inputs[nextFocus].focus();
      this.inputs[nextFocus].select();

      this._handleValueChange();
    }

    _handleValueChange() {
      const code = this.getValue();
      const isComplete = code.length === 6;

      if (typeof this.options.onChange === 'function') {
        this.options.onChange(code, isComplete);
      }

      if (isComplete && typeof this.options.onComplete === 'function') {
        this.options.onComplete(code);
      }
    }

    getValue() {
      return this.inputs.map((i) => i.value).join('');
    }

    setValue(code) {
      const clean = String(code || '').replace(/[^0-9]/g, '').slice(0, 6);
      this.clear();
      this._distributeValue(clean, 0);
    }

    clear() {
      this.inputs.forEach((input) => {
        input.value = '';
        input.classList.remove('is-invalid');
      });
      this.clearError();
    }

    focus() {
      if (this.inputs[0]) {
        this.inputs[0].focus();
        this.inputs[0].select();
      }
    }

    setError(message) {
      this.inputs.forEach((input) => {
        input.classList.add('is-invalid');
      });

      // Shake animation
      this.container.classList.remove('nx-shake');
      void this.container.offsetWidth; // trigger reflow
      this.container.classList.add('nx-shake');

      if (this.errorEl) {
        this.errorEl.textContent = message;
        this.errorEl.classList.remove('hidden');
        this.errorEl.setAttribute('role', 'alert');
      }

      // Focus first input
      this.focus();
    }

    clearError() {
      this.inputs.forEach((input) => {
        input.classList.remove('is-invalid');
      });
      this.container.classList.remove('nx-shake');

      if (this.errorEl) {
        this.errorEl.textContent = '';
        this.errorEl.classList.add('hidden');
      }
    }

    startCooldown(seconds) {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.remainingCooldown = typeof seconds === 'number' ? seconds : (this.options.resendCooldown || 60);

      const updateBtn = () => {
        if (!this.resendBtn) return;
        if (this.remainingCooldown > 0) {
          this.resendBtn.disabled = true;
          this.resendBtn.innerHTML = `<span>Resend in <strong class="font-mono">${this.remainingCooldown}s</strong></span>`;
          this.resendBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
          this.resendBtn.disabled = false;
          this.resendBtn.innerHTML = `<span>Resend code</span>`;
          this.resendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
      };

      updateBtn();
      this.timerInterval = setInterval(() => {
        this.remainingCooldown -= 1;
        updateBtn();
      }, 1000);
    }

    destroy() {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.container.innerHTML = '';
    }
  }

  // Export to window
  window.OtpInput = OtpInput;
  window.maskEmail = maskEmail;
})(window);

