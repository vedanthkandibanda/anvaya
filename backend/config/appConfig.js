const rawPublicBaseUrl =
    process.env.PUBLIC_BASE_URL ||
    process.env.BACKEND_PUBLIC_URL ||
    "https://anvaya-production.up.railway.app";

export const PUBLIC_BASE_URL = rawPublicBaseUrl.replace(/\/+$/, "");

export const buildPublicUploadUrl = (value) => {
    if (!value) return null;
    if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) {
        return value;
    }

    return `${PUBLIC_BASE_URL}/uploads/${value.replace(/^\/+/, "")}`;
};
