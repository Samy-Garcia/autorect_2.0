import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const useProductData = () => {
    const API_BASE = "http://localhost:3000/api";
    const API_PRODUCTS = `${API_BASE}/products`;
    const TOKEN_KEY = "accessToken";

    const [errorProduct, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const { logout } = useAuth();
    const authExpiredHandledRef = useRef(false);

    const handleUnauthorized = useCallback(async () => {
        if (authExpiredHandledRef.current) return;
        authExpiredHandledRef.current = true;
        await logout({ reason: "expired", callApi: false });
    }, [logout]);

    const getAccessToken = () =>
        localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

    const buildHeaders = (withBody = false) => {
        const token = getAccessToken();
        return {
            ...(withBody ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    };

    const normalizeProduct = (apiProduct = {}) => ({
    id: apiProduct._id || apiProduct.id || "",
    name: apiProduct.name || "",
    category: apiProduct.category || "General",
    stock: Number(apiProduct.stock) || 0,
    price: Number(apiProduct.price?.$numberDecimal ?? apiProduct.price) || 0,
    status: apiProduct.status || "stable",
    sku: apiProduct.sku || "N/A",
    supplier: apiProduct.supplier || "N/A",
});

    const extractApiPayload = (payload = {}) => {
        const data = payload?.data ?? null;
        return {
            data,
            message: payload?.message || "",
            errors: payload?.meta?.errors || [],
        };
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = getAccessToken();
            if (!token) {
                await handleUnauthorized();
                return;
            }

            const response = await fetch(API_PRODUCTS, {
                method: "GET",
                headers: buildHeaders(),
                credentials: "include",
            });

            const payload = await response.json().catch(() => ({}));
            const { data, message } = extractApiPayload(payload);

            if (!response.ok) {
                if (response.status === 401) {
                    await handleUnauthorized();
                    return;
                }
                throw new Error(message || "Error al obtener los productos");
            }

            const productList = Array.isArray(data) ? data.map(normalizeProduct) : [];
            setProducts(productList);
        } catch (error) {
            setProducts([]);
            setError(error.message);
            toast.error(error.message || "Error al obtener los productos");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (formData = {}) => {
        const normalizedPayload = {
            name: formData.name?.trim() || "",
            category: formData.category?.trim() || "General",
            stock: Number(formData.stock) || 0,
            price: Number(formData.price) || 0,
            status: formData.status || "stable",
            sku: formData.sku?.trim() || "N/A",
            supplier: formData.supplier?.trim() || "N/A",
        };

        if (!normalizedPayload.name || !normalizedPayload.price) {
            const message = "Nombre y precio son requeridos";
            setError(message);
            toast.error(message);
            return false;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(API_PRODUCTS, {
                method: "POST",
                headers: buildHeaders(true),
                body: JSON.stringify(normalizedPayload),
                credentials: "include",
            });

            const payload = await response.json().catch(() => ({}));
            const { message, errors } = extractApiPayload(payload);

            if (!response.ok) {
                if (response.status === 401) {
                    await handleUnauthorized();
                    return false;
                }
                const backendErrors = Array.isArray(errors) && errors.length > 0
                    ? `: ${errors.join(", ")}`
                    : "";
                throw new Error((message || "Error al crear el producto") + backendErrors);
            }

            toast.success(message || "Producto creado exitosamente");
            setSuccess(message || "Producto creado exitosamente");
            await fetchData();
            return true;
        } catch (error) {
            setError(error.message);
            toast.error(error.message || "Error al crear el producto");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSubmit = async (formData = {}, productId = null) => {
        if (!productId) {
            const message = "No se encontró el producto a actualizar";
            setError(message);
            toast.error(message);
            return false;
        }

        const normalizedPayload = {
            name: formData.name?.trim() || "",
            category: formData.category?.trim() || "General",
            stock: Number(formData.stock) || 0,
            price: Number(formData.price) || 0,
            status: formData.status || "stable",
            sku: formData.sku?.trim() || "N/A",
            supplier: formData.supplier?.trim() || "N/A",
        };

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(`${API_PRODUCTS}/${productId}`, {
                method: "PUT",
                headers: buildHeaders(true),
                body: JSON.stringify(normalizedPayload),
                credentials: "include",
            });

            const payload = await response.json().catch(() => ({}));
            const { message, errors } = extractApiPayload(payload);

            if (!response.ok) {
                if (response.status === 401) {
                    await handleUnauthorized();
                    return false;
                }
                const backendErrors = Array.isArray(errors) && errors.length > 0
                    ? `: ${errors.join(", ")}`
                    : "";
                throw new Error((message || "Error al actualizar el producto") + backendErrors);
            }

            toast.success(message || "Producto actualizado exitosamente");
            setSuccess(message || "Producto actualizado exitosamente");
            await fetchData();
            return true;
        } catch (error) {
            setError(error.message);
            toast.error(error.message || "Error al actualizar el producto");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (productId) => {
        if (!productId) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(`${API_PRODUCTS}/${productId}`, {
                method: "DELETE",
                headers: buildHeaders(),
                credentials: "include",
            });

            const payload = await response.json().catch(() => ({}));
            const { message } = extractApiPayload(payload);

            if (!response.ok) {
                if (response.status === 401) {
                    await handleUnauthorized();
                    return;
                }
                throw new Error(message || "Error al eliminar el producto");
            }

            toast.success(message || "Producto eliminado exitosamente");
            setSuccess(message || "Producto eliminado exitosamente");
            await fetchData();
        } catch (error) {
            setError(error.message);
            toast.error(error.message || "Error al eliminar el producto");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return {
        products,
        loading,
        errorProduct,
        fetchData,
        handleCreateSubmit,
        handleUpdateSubmit,
        deleteProduct,
    };
};

export default useProductData;