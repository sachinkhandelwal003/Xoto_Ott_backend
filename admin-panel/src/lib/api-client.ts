import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

let baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
let getAuthToken = () => localStorage.getItem("accessToken");

type UploadProgress = {
  loaded: number;
  total: number;
};

type ApiOptions = RequestInit & {
  onUploadProgress?: (progress: UploadProgress) => void;
};

export const getImageUrl = (filePath) => {
  if (!filePath) return "";
  if (filePath.startsWith("http")) return filePath;
  return `${baseUrl}${filePath}`;
};

export const setBaseUrl = (url) => {
  baseUrl = url;
};

export const setAuthTokenGetter = (getter) => {
  getAuthToken = getter;
};

const api = async (
  endpoint,
  options: ApiOptions = {}
) => {
  const headers: Record<string, string> = {
    ...options.headers,
  } as Record<string, string>;

  // Only set Content-Type to application/json if we're not sending FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const requestBody = options.body;
  // If we have FormData and onUploadProgress, use XMLHttpRequest for progress tracking
  if (options.body instanceof FormData && options.onUploadProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open(options.method || "POST", `${baseUrl}/api${endpoint}`);
      
      // Set headers (except Content-Type for FormData)
      Object.keys(headers).forEach(key => {
        xhr.setRequestHeader(key, headers[key]);
      });

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          options.onUploadProgress?.({
            loaded: event.loaded,
            total: event.total,
          });
        }
      });

      xhr.addEventListener("load", () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            reject(new Error(data.error || "API request failed"));
          }
        } catch (e) {
          reject(new Error("Failed to parse response"));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Network error")));
      xhr.addEventListener("abort", () => reject(new Error("Request aborted")));

      xhr.send(requestBody as XMLHttpRequestBodyInit);
    });
  }

  const res = await fetch(`${baseUrl}/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "API request failed");
  }

  return res.json();
};

// Auth
export const login = async (email, password) => {
  return api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const logout = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  return api("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
};

export const deleteAccount = async () => {
  return api("/auth/account", {
    method: "DELETE",
  });
};

export const getMe = async () => {
  try {
    const response = await api("/auth/me", {
      method: "GET",
    });
    return response.user;
  } catch (error) {
    // If it's a 401 Unauthorized, return null
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return null;
    }
    throw error;
  }
};

// Users
export const getUsersList = async (options) => {
  const params = new URLSearchParams();
  if (options?.search) params.set("search", options.search);
  if (options?.plan) params.set("plan", options.plan);
  if (options?.page) params.set("page", String(options.page));
  if (options?.limit) params.set("limit", String(options.limit));
  return api(`/users?${params.toString()}`);
};

export const getUserById = async (id) => {
  return api(`/users/${id}`);
};

export const updateUser = async (id, data) => {
  return api(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const banUser = async (id, reason) => {
  return api(`/users/${id}/ban`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
};

export const unbanUser = async (id) => {
  return api(`/users/${id}/unban`, { method: "POST" });
};

export const deleteUser = async (id) => {
  return api(`/users/${id}`, { method: "DELETE" });
};

// Hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ email, password }) =>
      login(email, password),
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      queryClient.invalidateQueries();
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: () => logout(),
    onSuccess: () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      queryClient.clear();
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: () => deleteAccount(),
    onSuccess: () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      queryClient.clear();
    },
  });
};

export const useGetMe = () => {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: 1,
  });
};

export const useGetUsersList = (options) => {
  return useQuery({
    queryKey: ["users-list", options],
    queryFn: () => getUsersList(options),
  });
};

export const useGetUserById = (id) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const result = await getUserById(id);
      return result.data;
    },
    enabled: !!id,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, data }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export const useBanUser = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, reason }) =>
      banUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export const useUnbanUser = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: unbanUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
    },
  });
};

// Languages
export const getLanguagesList = async () => {
  return api("/languages");
};

export const getLanguageById = async (id) => {
  return api(`/languages/${id}`);
};

export const createLanguage = async (formData, options) => {
  return api("/languages", {
    method: "POST",
    body: formData,
    ...options,
  });
};

export const updateLanguage = async (id, formData, options) => {
  return api(`/languages/${id}`, {
    method: "PUT",
    body: formData,
    ...options,
  });
};

export const deleteLanguage = async (id) => {
  return api(`/languages/${id}`, { method: "DELETE" });
};

// Hooks
export const useGetLanguagesList = () => {
  return useQuery({
    queryKey: ["languages-list"],
    queryFn: () => getLanguagesList(),
  });
};

export const useGetLanguageById = (id) => {
  return useQuery({
    queryKey: ["language", id],
    queryFn: () => getLanguageById(id),
    enabled: !!id,
  });
};

export const useCreateLanguage = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ data, onUploadProgress }) => 
      createLanguage(data, { onUploadProgress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["languages-list"] });
    },
  });
};

export const useUpdateLanguage = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, data, onUploadProgress }) => 
      updateLanguage(id, data, { onUploadProgress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["languages-list"] });
    },
  });
};

export const useDeleteLanguage = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteLanguage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["languages-list"] });
    },
  });
};

// Promotions
export const getPromotionsList = async (options) => {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", options.page.toString());
  if (options?.limit) params.set("limit", options.limit.toString());
  return api(`/promotions?${params.toString()}`);
};

export const getActivePromotion = async () => {
  return api("/promotions/active");
};

export const getPromotionById = async (id) => {
  return api(`/promotions/${id}`);
};

export const createPromotion = async (data, options) => {
  return api("/promotions", {
    method: "POST",
    body: data,
    ...options,
  });
};

export const updatePromotion = async (id, data, options) => {
  return api(`/promotions/${id}`, {
    method: "PUT",
    body: data,
    ...options,
  });
};

export const deletePromotion = async (id) => {
  return api(`/promotions/${id}`, { method: "DELETE" });
};

// Hooks
export const useGetPromotionsList = (options) => {
  return useQuery({
    queryKey: ["promotions-list", options],
    queryFn: () => getPromotionsList(options),
  });
};

export const useGetActivePromotion = () => {
  return useQuery({
    queryKey: ["promotion-active"],
    queryFn: getActivePromotion,
  });
};

export const useGetPromotionById = (id) => {
  return useQuery({
    queryKey: ["promotion", id],
    queryFn: async () => {
      const result = await getPromotionById(id);
      return result.data;
    },
    enabled: !!id,
  });
};

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ data, onUploadProgress }) => 
      createPromotion(data, { onUploadProgress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions-list"] });
      queryClient.invalidateQueries({ queryKey: ["promotion-active"] });
    },
  });
};

export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, data, onUploadProgress }) => 
      updatePromotion(id, data, { onUploadProgress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions-list"] });
      queryClient.invalidateQueries({ queryKey: ["promotion-active"] });
    },
  });
};

export const useDeletePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deletePromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions-list"] });
      queryClient.invalidateQueries({ queryKey: ["promotion-active"] });
    },
  });
};

// Banner Shows
export const getBannersList = async (options) => {
  const params = new URLSearchParams();
  if (options?.admin) params.set("admin", "true");
  if (options?.platform) params.set("platform", options.platform);
  return api(`/banners?${params.toString()}`);
};

export const getBannerById = async (bannerId) => {
  return api(`/banners/item/${bannerId}`);
};

export const getBannerShowByContentId = async (
  contentId,
  options
) => {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", options.page.toString());
  if (options?.limit) params.set("limit", options.limit.toString());
  return api(`/banners/${contentId}?${params.toString()}`);
};

export const createBannerShow = async (
  data,
  options
) => {
  return api("/banners", {
    method: "POST",
    body: data,
    ...options,
  });
};

export const updateBanner = async (
  bannerId,
  data,
  options
) => {
  return api(`/banners/item/${bannerId}`, {
    method: "PUT",
    body: data,
    ...options,
  });
};

export const deleteBanner = async (bannerId) => {
  return api(`/banners/item/${bannerId}`, { method: "DELETE" });
};

export const appendBannerShowVideo = async (
  contentId,
  data,
  options
) => {
  return api(`/banners/${contentId}/videos`, {
    method: "POST",
    body: data,
    ...options,
  });
};

export const updateEpisodeLock = async (episodeId, isLocked) => {
  return api(`/episodes/${episodeId}/lock`, {
    method: "PATCH",
    body: JSON.stringify({ isLocked }),
  });
};

export const useGetBannersList = (options) => {
  return useQuery({
    queryKey: ["banners-list", options],
    queryFn: () => getBannersList(options),
  });
};

export const useGetBannerById = (bannerId) => {
  return useQuery({
    queryKey: ["banner", bannerId],
    queryFn: async () => {
      const result = await getBannerById(bannerId);
      return result.data;
    },
    enabled: !!bannerId,
  });
};

export const useGetBannerShowByContentId = (
  contentId,
  options
) => {
  return useQuery({
    queryKey: ["banner-show", contentId, options],
    queryFn: async () => {
      const result = await getBannerShowByContentId(contentId, options);
      return result.data;
    },
    enabled: !!contentId,
  });
};

export const useCreateBannerShow = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({
      data,
      onUploadProgress,
    }) => createBannerShow(data, { onUploadProgress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners-list"] });
    },
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({
      bannerId,
      data,
      onUploadProgress,
    }) => updateBanner(bannerId, data, { onUploadProgress }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["banners-list"] });
      queryClient.invalidateQueries({ queryKey: ["banner", variables.bannerId] });
      queryClient.invalidateQueries({ queryKey: ["banner-show"] });
    },
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners-list"] });
      queryClient.invalidateQueries({ queryKey: ["banner-show"] });
    },
  });
};

export const useAppendBannerShowVideo = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({
      contentId,
      data,
      onUploadProgress,
    }) => appendBannerShowVideo(contentId, data, { onUploadProgress }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["banners-list"] });
      queryClient.invalidateQueries({ queryKey: ["banner-show", variables.contentId] });
    },
  });
};

export const useUpdateEpisodeLock = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ episodeId, isLocked }) =>
      updateEpisodeLock(episodeId, isLocked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banner-show"] });
    },
  });
};

// Categories
export const getCategoriesList = async (options) => {
  const params = new URLSearchParams();
  if (options?.admin) params.set("admin", "true");
  return api(`/categories?${params.toString()}`);
};

export const getCategoriesWithContent = async () => {
  return api("/categories/with-content");
};

export const getCategoryById = async (categoryId) => {
  return api(`/categories/item/${categoryId}`);
};

export const getCategoryContents = async (categoryId, options) => {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", options.page.toString());
  if (options?.limit) params.set("limit", options.limit.toString());
  return api(`/categories/${categoryId}/contents?${params.toString()}`);
};

export const createCategory = async (data, options) => {
  return api("/categories", {
    method: "POST",
    body: data,
    ...options,
  });
};

export const updateCategory = async (categoryId, data, options) => {
  return api(`/categories/item/${categoryId}`, {
    method: "PUT",
    body: data,
    ...options,
  });
};

export const deleteCategory = async (categoryId) => {
  return api(`/categories/item/${categoryId}`, { method: "DELETE" });
};

export const addContentToCategory = async (categoryId, contentId) => {
  return api(`/categories/${categoryId}/contents/${contentId}`, { method: "POST" });
};

export const removeContentFromCategory = async (categoryId, contentId) => {
  return api(`/categories/${categoryId}/contents/${contentId}`, { method: "DELETE" });
};

// Hooks
export const useGetCategoriesList = (options) => {
  return useQuery({
    queryKey: ["categories-list", options],
    queryFn: () => getCategoriesList(options),
  });
};

export const useGetCategoriesWithContent = () => {
  return useQuery({
    queryKey: ["categories-with-content"],
    queryFn: getCategoriesWithContent,
  });
};

export const useGetCategoryById = (categoryId) => {
  return useQuery({
    queryKey: ["category", categoryId],
    queryFn: async () => {
      const result = await getCategoryById(categoryId);
      return result.data;
    },
    enabled: !!categoryId,
  });
};

export const useGetCategoryContents = (categoryId, options) => {
  return useQuery({
    queryKey: ["category-contents", categoryId, options],
    queryFn: () => getCategoryContents(categoryId, options),
    enabled: !!categoryId,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ data, onUploadProgress }) =>
      createCategory(data, { onUploadProgress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ categoryId, data, onUploadProgress }) =>
      updateCategory(categoryId, data, { onUploadProgress }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["category", variables.categoryId] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
    },
  });
};

export const useAddContentToCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ categoryId, contentId }) =>
      addContentToCategory(categoryId, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-content"] });
    },
  });
};

export const useRemoveContentFromCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ categoryId, contentId }) =>
      removeContentFromCategory(categoryId, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-content"] });
    },
  });
};

// Category Shows
export const createCategoryShow = async (data, options) => {
  return api("/categories/show", {
    method: "POST",
    body: data,
    ...options,
  });
};

export const appendCategoryShowVideo = async (
  contentId,
  data,
  options
) => {
  return api(`/categories/${contentId}/videos`, {
    method: "POST",
    body: data,
    ...options,
  });
};

export const getCategoryShowByContentId = async (
  contentId,
  options
) => {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", options.page.toString());
  if (options?.limit) params.set("limit", options.limit.toString());
  return api(`/categories/${contentId}?${params.toString()}`);
};

export const updateCategoryEpisodeLock = async (episodeId, isLocked) => {
  return api(`/categories/episodes/${episodeId}/lock`, {
    method: "PUT",
    body: JSON.stringify({ isLocked }),
  });
};

// Hooks
export const useCreateCategoryShow = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ data, onUploadProgress }) =>
      createCategoryShow(data, { onUploadProgress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-content"] });
    },
  });
};

export const useAppendCategoryShowVideo = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({
      contentId,
      data,
      onUploadProgress,
    }) => appendCategoryShowVideo(contentId, data, { onUploadProgress }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-content"] });
      queryClient.invalidateQueries({
        queryKey: ["category-show", variables.contentId],
      });
    },
  });
};

export const useGetCategoryShowByContentId = (
  contentId,
  options
) => {
  return useQuery({
    queryKey: ["category-show", contentId, options],
    queryFn: async () => {
      const result = await getCategoryShowByContentId(contentId, options);
      return result.data;
    },
    enabled: !!contentId,
  });
};

export const useUpdateCategoryEpisodeLock = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ episodeId, isLocked }) =>
      updateCategoryEpisodeLock(episodeId, isLocked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-show"] });
      queryClient.invalidateQueries({ queryKey: ["banner-show"] });
    },
  });
};

// Content / Shows
export const getContentList = async (options) => {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", options.page.toString());
  if (options?.limit) params.set("limit", options.limit.toString());
  if (options?.search) params.set("search", options.search);
  if (options?.type) params.set("type", options.type);
  if (options?.status) params.set("status", options.status);
  return api(`/contents?${params.toString()}`);
};

export const createContent = async (data, options) => {
  return api("/contents", {
    method: "POST",
    body: data,
    ...options,
  });
};

export const getContentById = async (id) => {
  return api(`/contents/${id}`);
};

export const appendContentVideo = async (contentId, data, options) => {
  return api(`/contents/${contentId}/videos`, {
    method: "POST",
    body: data,
    ...options,
  });
};

export const updateContentEpisodeLock = async (episodeId, isLocked) => {
  return api(`/contents/episodes/${episodeId}/lock`, {
    method: "PUT",
    body: JSON.stringify({ isLocked }),
  });
};

export const updateContent = async (id, data) => {
  return api(`/contents/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
};

export const deleteContent = async (id) => {
  return api(`/contents/${id}`, { method: "DELETE" });
};

// Hooks
export const useGetContentList = (options) => {
  return useQuery({
    queryKey: ["content-list", options],
    queryFn: () => getContentList(options),
  });
};

export const useGetContentById = (id) => {
  return useQuery({
    queryKey: ["content", id],
    queryFn: async () => {
      const result = await getContentById(id);
      return result.data;
    },
    enabled: !!id,
  });
};

export const useCreateContent = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ data, onUploadProgress }) =>
      createContent(data, { onUploadProgress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-content"] });
    },
  });
};

export const useAppendContentVideo = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({
      contentId,
      data,
      onUploadProgress,
    }) => appendContentVideo(contentId, data, { onUploadProgress }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["content-list"] });
      queryClient.invalidateQueries({ queryKey: ["content", variables.contentId] });
    },
  });
};

export const useUpdateContentEpisodeLock = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ episodeId, isLocked }) =>
      updateContentEpisodeLock(episodeId, isLocked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-list"] });
    },
  });
};

export const useUpdateContent = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, data }) => updateContent(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["content-list"] });
      queryClient.invalidateQueries({ queryKey: ["content", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-content"] });
    },
  });
};

export const useDeleteContent = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-content"] });
    },
  });
};

// Pages API
export const getPages = async () => {
  return api('/pages');
};

export const getPageBySlug = async (slug: string) => {
  return api(`/pages/${slug}`);
};

export const createPage = async (data: any) => {
  return api('/pages', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  });
};

export const updatePage = async (id: string, data: any) => {
  return api(`/pages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  });
};

export const deletePage = async (id: string) => {
  return api(`/pages/${id}`, { method: 'DELETE' });
};

export const useGetPages = () => {
  return useQuery({
    queryKey: ['pages'],
    queryFn: getPages
  });
};

export const useGetPageBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['page', slug],
    queryFn: () => getPageBySlug(slug)
  });
};

export const useCreatePage = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: createPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    }
  });
};

export const useUpdatePage = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, data }: any) => updatePage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    }
  });
};

export const useDeletePage = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deletePage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    }
  });
};

// Ads API
export const getAds = async (options?: any) => {
  const params = new URLSearchParams();
  if (options?.type) params.set('type', options.type);
  if (options?.platform) params.set('platform', options.platform);
  return api(`/ads?${params.toString()}`);
};

export const createAd = async (data: any) => {
  return api('/ads', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  });
};

export const updateAd = async (id: string, data: any) => {
  return api(`/ads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  });
};

export const deleteAd = async (id: string) => {
  return api(`/ads/${id}`, { method: 'DELETE' });
};

export const useGetAds = (options?: any) => {
  return useQuery({
    queryKey: ['ads', options],
    queryFn: () => getAds(options)
  });
};

export const useCreateAd = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: createAd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
    }
  });
};

export const useUpdateAd = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: ({ id, data }: any) => updateAd(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
    }
  });
};

export const useDeleteAd = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: deleteAd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
    }
  });
};
