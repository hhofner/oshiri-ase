import { useSignal } from "@preact/signals";
import SweatCounter from "../islands/SweatCounter.tsx";

export default function Home() {
  const count = useSignal(0);
  return (
    <div class="px-4 py-12 mx-auto bg-[#f0f9ff] min-h-screen flex flex-col items-center">
      <div class="max-w-screen-lg w-full flex flex-col items-center">
        <SweatCounter count={count} />
      </div>
    </div>
  );
}
