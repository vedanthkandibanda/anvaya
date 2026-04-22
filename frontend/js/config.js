(() => {
    const legacyBaseUrl = "https://anvaya-production.up.railway.app";
    const configuredApiBaseUrl = window.__ANVAYA_API_BASE_URL__ || legacyBaseUrl;
    const apiBaseUrl = configuredApiBaseUrl.replace(/\/+$/, "");
    const appRoutes = Object.freeze({
        home: "/",
        login: "/login",
        register: "/register",
        forgotPassword: "/forgot-password",
        resetPassword: "/reset-password",
        profileSetup: "/profile-setup",
        dashboard: "/dashboard",
        chat: "/chat",
        music: "/music",
        vault: "/vault",
        settings: "/settings",
        profile: "/profile",
        about: "/about"
    });

    const replaceLegacyBase = (value) => {
        if (typeof value !== "string") {
            return value;
        }
        return value.startsWith(legacyBaseUrl)
            ? `${apiBaseUrl}${value.slice(legacyBaseUrl.length)}`
            : value;
    };

    const buildApiUrl = (path = "") => {
        if (!path) return apiBaseUrl;
        return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    };

    const buildUploadUrl = (fileName = "") => {
        if (!fileName) return `${apiBaseUrl}/uploads/`;
        return `${apiBaseUrl}/uploads/${String(fileName).replace(/^\/+/, "")}`;
    };

    const buildPageUrl = (routeNameOrPath = "") => {
        if (!routeNameOrPath) {
            return appRoutes.home;
        }

        const route = appRoutes[routeNameOrPath] || routeNameOrPath;
        if (/^https?:\/\//i.test(route)) {
            return route;
        }

        return route.startsWith("/") ? route : `/${route.replace(/^\/+/, "")}`;
    };

    const navigateTo = (routeNameOrPath) => {
        window.location.href = buildPageUrl(routeNameOrPath);
    };

    window.APP_CONFIG = {
        apiBaseUrl,
        socketUrl: apiBaseUrl,
        legacyBaseUrl,
        routes: appRoutes,
        buildApiUrl,
        buildUploadUrl,
        buildPageUrl,
        navigateTo,
        replaceLegacyBase
    };

    const originalFetch = window.fetch?.bind(window);
    if (originalFetch) {
        window.fetch = (input, init) => {
            if (typeof input === "string") {
                return originalFetch(replaceLegacyBase(input), init);
            }
            if (input instanceof Request) {
                return originalFetch(new Request(replaceLegacyBase(input.url), input), init);
            }
            return originalFetch(input, init);
        };
    }

    const wrapIo = (originalIo) => {
        if (typeof originalIo !== "function") {
            return originalIo;
        }

        const wrappedIo = (url, ...args) => {
            if (typeof url === "string") {
                return originalIo(replaceLegacyBase(url), ...args);
            }
            return originalIo(url, ...args);
        };

        Object.assign(wrappedIo, originalIo);
        return wrappedIo;
    };

    let wrappedIo = null;
    Object.defineProperty(window, "io", {
        configurable: true,
        enumerable: true,
        get() {
            return wrappedIo;
        },
        set(value) {
            wrappedIo = wrapIo(value);
        }
    });

    const rewriteElementUrls = (root) => {
        if (!(root instanceof Element)) {
            return;
        }

        const elements = [
            root,
            ...root.querySelectorAll("[src], [href], [action], source[src], audio[src], img[src]")
        ];

        elements.forEach((element) => {
            ["src", "href", "action", "poster"].forEach((attribute) => {
                const value = element.getAttribute?.(attribute);
                if (value && value.startsWith(legacyBaseUrl)) {
                    element.setAttribute(attribute, replaceLegacyBase(value));
                }
            });
        });
    };

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "attributes" && mutation.target instanceof Element) {
                rewriteElementUrls(mutation.target);
            }

            mutation.addedNodes.forEach((node) => {
                rewriteElementUrls(node);
            });
        });
    });

    document.addEventListener("DOMContentLoaded", () => {
        rewriteElementUrls(document.body);
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["src", "href", "action", "poster"]
        });
    });
})();
