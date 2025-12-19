import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";

/**
 * SSO Login Page
 *
 * This page handles the SSO callback from BidChemz.
 * It stores the auth token and bid data, then redirects to the freight request form.
 */
export default function SSOLogin() {
  const router = useRouter();
  const { token: ssoToken } = router.query;
  const { loginWithToken } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Authenticating...");

  useEffect(() => {
    if (!router.isReady) return;

    const processSSOToken = async () => {
      try {
        if (!ssoToken || typeof ssoToken !== "string") {
          setStatus("error");
          setMessage("Invalid or missing SSO token");
          return;
        }

        // Call the SSO API to verify token and get auth credentials
        const response = await fetch("/api/auth/sso", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: ssoToken }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "SSO authentication failed");
        }

        // Use context login to update app state
        loginWithToken(data.token, data.user);

        // Store detailed bid and counterparty data for persistent use across the platform
        if (data.bidData) {
          localStorage.setItem("sso_bid_data", JSON.stringify(data.bidData));
        }

        setStatus("success");
        setMessage("Authentication successful! Redirecting...");

        // Redirect to the freight request form
        setTimeout(() => {
          router.push(data.redirectUrl || "/quotes/new?prefill=true");
        }, 1000);
      } catch (err) {
        console.error("SSO error:", err);
        setStatus("error");
        setMessage(
          err instanceof Error ? err.message : "Authentication failed"
        );
      }
    };

    processSSOToken();
  }, [router.isReady, ssoToken, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            BidChemz Logistics
          </h2>

          {status === "loading" && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center">
              <div className="text-green-500 mb-4">
                <svg
                  className="h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-green-600 font-semibold">{message}</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center">
              <div className="text-red-500 mb-4">
                <svg
                  className="h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-red-600 font-semibold mb-4">{message}</p>
              <button
                onClick={() => router.push("/login")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-500 mt-8">
          <p>Secure single sign-on from BidChemz</p>
        </div>
      </div>
    </div>
  );
}
