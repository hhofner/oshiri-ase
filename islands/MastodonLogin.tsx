import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface MastodonLoginProps {
  onLoginSuccess?: (user: { id: string; username: string; display_name: string; avatar: string }) => void;
}

export default function MastodonLogin({ onLoginSuccess }: MastodonLoginProps) {
  const isLoggedIn = useSignal(false);
  const user = useSignal<null | { id: string; username: string; display_name: string; avatar: string }>(null);
  const isLoading = useSignal(false);

  // Check login status on component mount
  useEffect(() => {
    checkLoginStatus();
  }, []);

  async function checkLoginStatus() {
    try {
      const response = await fetch("/api/auth/status");
      const data = await response.json();
      
      isLoggedIn.value = data.isLoggedIn;
      if (data.isLoggedIn && data.user) {
        user.value = data.user;
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
      }
    } catch (error) {
      console.error("Failed to check login status:", error);
    }
  }

  function handleLogin() {
    isLoading.value = true;
    // Redirect to the Mastodon authorization endpoint
    window.location.href = "/api/auth/login";
  }

  async function handleLogout() {
    isLoading.value = true;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      isLoggedIn.value = false;
      user.value = null;
      isLoading.value = false;
    } catch (error) {
      console.error("Failed to logout:", error);
      isLoading.value = false;
    }
  }

  return (
    <div class="flex flex-col items-center mt-6">
      {isLoggedIn.value ? (
        <div class="flex flex-col items-center">
          <div class="flex items-center mb-4">
            {user.value?.avatar && (
              <img 
                src={user.value.avatar} 
                alt="Profile" 
                class="w-10 h-10 rounded-full mr-3"
              />
            )}
            <div>
              <p class="font-bold">{user.value?.display_name}</p>
              <p class="text-sm text-gray-600">@{user.value?.username}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoading.value}
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {isLoading.value ? "Logging out..." : "Logout"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleLogin}
          disabled={isLoading.value}
          class="px-6 py-3 bg-[#6364FF] text-white rounded-lg hover:bg-[#5253ee] transition-colors flex items-center"
        >
          {isLoading.value ? (
            "Connecting..."
          ) : (
            <>
              <span class="mr-2">Login with Mastodon</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M21.327 8.566c0-4.339-2.843-5.61-2.843-5.61-1.433-.658-3.894-.935-6.451-.956h-.063c-2.557.021-5.016.298-6.45.956 0 0-2.843 1.272-2.843 5.61 0 .993-.019 2.181.012 3.441.103 4.243.778 8.425 4.701 9.463 1.809.479 3.362.579 4.612.51 2.268-.126 3.541-.809 3.541-.809l-.075-1.646s-1.621.511-3.441.449c-1.804-.062-3.707-.194-3.999-2.409a4.523 4.523 0 0 1-.04-.621s1.77.433 4.014.536c1.372.063 2.658-.08 3.965-.236 2.506-.299 4.688-1.843 4.962-3.254.434-2.223.398-5.424.398-5.424zm-3.353 5.59h-2.081V9.057c0-1.075-.452-1.62-1.357-1.62-1 0-1.501.647-1.501 1.927v2.791h-2.069V9.364c0-1.28-.501-1.927-1.501-1.927-.905 0-1.357.546-1.357 1.62v5.099H6.026V8.903c0-1.074.273-1.927.823-2.558.566-.631 1.307-.955 2.228-.955 1.065 0 1.872.409 2.405 1.228l.518.869.519-.869c.533-.819 1.34-1.228 2.405-1.228.92 0 1.662.324 2.228.955.549.631.822 1.484.822 2.558v5.253z"/>
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  );
}