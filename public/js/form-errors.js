// ==========================================================================
// Nexus Form Errors & Validation Module
// Shared across register, signin, and dashboard
// ==========================================================================

function cleanDomain(v) {
    if (!v) return '';
    return v.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/^@/, '').replace(/\/.*$/, '');
}

function domainMatches(email, domain) {
    const d = (email.split('@')[1] || '').toLowerCase();
    return !!d && (d === domain || d.endsWith('.' + domain));
}

const RULES = {
    // register.html / OrgCreation.html
    org_name: (val) => {
        if (!val || !val.trim()) return "Enter your organization name.";
        return false;
    },
    org_id: (val) => {
        const v = val ? val.trim() : '';
        if (!v || !/^[A-Za-z0-9_\-]+$/.test(v)) return "Use letters, numbers and hyphens only.";
        return false;
    },
    allowed_domains: (val) => {
        const d = cleanDomain(val);
        if (!d || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d)) return "Enter a valid domain, like acme.com.";
        return false;
    },
    website: (val) => {
        const v = val ? val.trim() : '';
        if (!v) return false;
        if (!/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(v)) return "Enter a full URL, like https://acme.com.";
        return false;
    },
    description: () => false,
    admin_name: (val) => {
        if (!val || !val.trim()) return "Enter the administrator's name.";
        return false;
    },
    admin_email: (val) => {
        const v = val ? val.trim().toLowerCase() : '';
        if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
            const domainEl = document.getElementById('allowed_domains');
            const d = domainEl ? cleanDomain(domainEl.value) : '';
            return d ? `Use an email ending in @${d}.` : "Enter a valid work email.";
        }
        const domainEl = document.getElementById('allowed_domains');
        const d = domainEl ? cleanDomain(domainEl.value) : '';
        if (d && !domainMatches(v, d)) {
            return `Use an email ending in @${d}.`;
        }
        return false;
    },
    admin_password: (val) => {
        if (!val || val.length < 8) return "Password must be at least 8 characters.";
        return false;
    },
    admin_confirm_password: (val) => {
        const pw = document.getElementById('admin_password')?.value || '';
        if (!val || val !== pw) return "Passwords don't match.";
        return false;
    },

    // signin.html
    email: (val) => {
        const v = val ? val.trim() : '';
        if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter your work email.";
        return false;
    },
    password: (val) => {
        if (!val || !val.trim()) return "Enter your password.";
        return false;
    },
    resetEmail: (val) => {
        const v = val ? val.trim() : '';
        if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter your work email.";
        return false;
    },
    resetNewPassword: (val) => {
        if (!val || val.length < 8) return "Password must be at least 8 characters.";
        return false;
    },
    resetConfirmPassword: (val) => {
        const pw = document.getElementById('resetNewPassword')?.value || '';
        if (!val || val !== pw) return "Passwords don't match.";
        return false;
    },

    // dashboard.html
    wsName: (val) => {
        if (!val || !val.trim()) return "Enter a workspace name.";
        return false;
    },
    inviteEmail: (val) => {
        const v = val ? val.trim() : '';
        if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid employee email.";
        return false;
    },
    taskTitle: (val) => {
        if (!val || !val.trim()) return "Enter a task title.";
        return false;
    },
    editTaskTitle: (val) => {
        if (!val || !val.trim()) return "Enter a task title.";
        return false;
    }
};

function setFieldError(input, message) {
    if (typeof input === 'string') input = document.getElementById(input);
    if (!input) return;

    const errorId = input.getAttribute('aria-describedby') || (input.id + '_err');
    let errorEl = document.getElementById(errorId);

    if (message) {
        input.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
            errorEl.setAttribute('role', 'alert');
        }
    } else {
        input.classList.remove('is-invalid');
        input.setAttribute('aria-invalid', 'false');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.add('hidden');
        }
    }
}

function checkField(input) {
    if (typeof input === 'string') input = document.getElementById(input);
    if (!input) return true;

    const rule = RULES[input.id];
    let error = false;
    if (rule) {
        error = rule(input.value);
    } else if (input.hasAttribute('required') && !input.value.trim()) {
        error = "This field is required.";
    }

    setFieldError(input, error || '');
    return !error;
}

function validateGroup(container) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return true;

    const inputs = container.querySelectorAll('input:not([type="hidden"]), select, textarea');
    let firstInvalid = null;
    let allValid = true;

    inputs.forEach((input) => {
        if (input.disabled || input.offsetParent === null) return;
        const valid = checkField(input);
        if (!valid) {
            allValid = false;
            if (!firstInvalid) firstInvalid = input;
        }
    });

    if (firstInvalid) {
        firstInvalid.focus();
    }
    return allValid;
}

function showFormError(message, alertEl) {
    if (typeof alertEl === 'string') alertEl = document.getElementById(alertEl);
    if (!alertEl) {
        alertEl = document.querySelector('[role="alert"]:not(.nx-error), #error_alert, #errorAlert, #createWsAlert, #createTaskAlert, #editTaskAlert');
    }
    if (!alertEl) return;

    const msgSpan = alertEl.querySelector('#error_message, #errorMessage') || alertEl;
    msgSpan.textContent = message;
    alertEl.classList.remove('hidden');
    alertEl.setAttribute('role', 'alert');
    alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearFormError(alertEl) {
    if (typeof alertEl === 'string') alertEl = document.getElementById(alertEl);
    if (!alertEl) {
        alertEl = document.querySelector('[role="alert"]:not(.nx-error), #error_alert, #errorAlert, #createWsAlert, #createTaskAlert, #editTaskAlert');
    }
    if (alertEl) {
        alertEl.classList.add('hidden');
    }
}

function showFieldErrorFromServer(fieldId, message) {
    const input = document.getElementById(fieldId);
    if (!input) {
        showFormError(message);
        return;
    }

    // If inside a wizard step, switch to the step containing this field
    const stepEl = input.closest('.nx-step');
    if (stepEl && typeof window.setStep === 'function') {
        const stepNum = Number(stepEl.dataset.step);
        if (stepNum) window.setStep(stepNum);
    }

    setFieldError(input, message);
    input.focus();
}

function showSuccessToast(message) {
    const existing = document.getElementById('nxSuccessToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'nxSuccessToast';
    toast.setAttribute('role', 'status');
    toast.className = 'fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-950/20 transition-all duration-300';
    toast.innerHTML = '<i class="bi bi-check-circle-fill text-base"></i><span>' + message + '</span>';
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function bindLiveValidation(formOrContainer) {
    if (typeof formOrContainer === 'string') formOrContainer = document.querySelector(formOrContainer);
    if (!formOrContainer) return;

    const inputs = formOrContainer.querySelectorAll('input:not([type="hidden"]), select, textarea');
    inputs.forEach((input) => {
        // Blur validation: validate only if touched or has value
        input.addEventListener('blur', () => {
            if (input.value.trim() !== '' || input.dataset.touched === 'true') {
                checkField(input);
            }
        });

        // Input validation: if currently invalid, re-check to clear immediately
        input.addEventListener('input', () => {
            input.dataset.touched = 'true';
            if (input.classList.contains('is-invalid')) {
                checkField(input);
            }
        });
    });
}

