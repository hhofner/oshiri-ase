import type { Signal } from "@preact/signals";
import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import MastodonLogin from "./MastodonLogin.tsx";
import WorldMap from "./WorldMap.tsx";

interface SweatCounterProps {
  count: Signal<number>;
}

interface LocationPin {
  id: string;
  lat: number;
  lng: number;
  username: string;
  timestamp?: number;
}

export default function SweatCounter(props: SweatCounterProps) {
  const isLoggedIn = useSignal(false);
  const user = useSignal<null | { id: string; username: string; display_name: string; avatar: string }>(null);
  const pins = useSignal<LocationPin[]>([]);
  const isAddingPin = useSignal(false);
  const error = useSignal("");

  // Fetch pins when component mounts
  useEffect(() => {
    fetchPins();
    fetchDripCount();
  }, []);

  async function fetchPins() {
    try {
      const response = await fetch("/api/pins");
      if (response.ok) {
        const data = await response.json();
        // Sort pins by timestamp if available
        pins.value = data.sort((a: LocationPin, b: LocationPin) =>
          (b.timestamp || 0) - (a.timestamp || 0)
        );
      }
    } catch (err) {
      console.error("Error fetching pins:", err);
    }
  }

  async function fetchDripCount() {
    try {
      const response = await fetch("/api/drip-count");
      if (response.ok) {
        const data = await response.json();
        props.count.value = data.count;
      }
    } catch (err) {
      console.error("Error fetching drip count:", err);
    }
  }

  function handleLoginSuccess(userData: { id: string; username: string; display_name: string; avatar: string }) {
    isLoggedIn.value = true;
    user.value = userData;
  }

  async function handleAddDrip() {
    if (isLoggedIn.value) {
      try {
        const response = await fetch("/api/drip-count", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          props.count.value = data.count;
          console.log(`Drip count updated to: ${data.count}`);
        }
      } catch (err) {
        console.error("Error incrementing drip count:", err);
        // Fallback to client-side increment if API call fails
        props.count.value++;
      }
    }
  }

  async function handleAddPin(lat: number, lng: number) {
    if (!isLoggedIn.value || !user.value) return;

    isAddingPin.value = true;
    error.value = "";

    try {
      // First increment the drip count
      await handleAddDrip();

      // Then add the pin
      const response = await fetch("/api/pins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ lat, lng })
      });

      if (response.ok) {
        const data = await response.json();
        // Add the new pin to the beginning of the array
        pins.value = [data.pin, ...pins.value];
        // Refresh pins to ensure consistency
        await fetchPins();
      } else {
        const errorData = await response.json();
        error.value = errorData.error || "Failed to add pin";
      }
    } catch (err) {
      console.error("Error adding pin:", err);
      error.value = "Network error, please try again";
    } finally {
      isAddingPin.value = false;
    }
  }

  return (
    <div class="flex flex-col items-center justify-center w-full">
      <div className="w-full mb-8 rounded-lg overflow-hidden">
        <WorldMap
          pins={pins.value}
          onAddPin={handleAddPin}
          currentUser={isLoggedIn.value ? user.value : null}
        />
      </div>

      <div class="text-6xl my-6">💦</div>
      <h1 class="text-6xl font-bold text-[#0ea5e9]">{props.count.value}</h1>
      <h2 class="text-3xl mt-2 mb-4 font-medium text-[#0ea5e9]">お尻汗</h2>
      <p class="my-6 text-center text-lg">
        Counting the number of times sweat has dripped down the crack of a butt (oshiri-ase).
      </p>

      {error.value && (
        <p class="text-red-500 mb-4">{error.value}</p>
      )}

      {isLoggedIn.value ? (
        <button
          onClick={async () => {
            await handleAddDrip();
            await fetchPins(); // Refresh pins after adding a drip
          }}
          class="px-8 py-4 bg-[#0ea5e9] text-white rounded-lg text-xl font-bold hover:bg-[#0284c7] transition-colors mb-4"
        >
          Add a Drip 🍑💦
        </button>
      ) : (
        <p class="text-center text-gray-600 mb-4">Log in with Mastodon (famichiki.jp) to add drips</p>
      )}

      <MastodonLogin onLoginSuccess={handleLoginSuccess} />
    </div>
  );
}
