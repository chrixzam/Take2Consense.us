import React, { useEffect, useRef } from "react";

type PlacePickerProps = {
  placeholder?: string;
  onPlaceChanged?: (place: unknown) => void;
  className?: string;
};

// Lightweight React wrapper around the gmpx-place-picker web component.
export default function PlacePicker({ placeholder = "Enter an address", onPlaceChanged, className }: PlacePickerProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current as unknown as HTMLElement | null;
    if (!el || !onPlaceChanged) return;

    // The component dispatches custom events; name may vary by version.
    // We listen broadly and pass the event detail through.
    const handler = (e: Event) => {
      // @ts-expect-error CustomEvent detail is not typed
      const detail = (e as CustomEvent)?.detail;
      onPlaceChanged(detail);
    };

    el.addEventListener("placechange", handler as EventListener);
    el.addEventListener("gmpx-placechange", handler as EventListener);

    return () => {
      el.removeEventListener("placechange", handler as EventListener);
      el.removeEventListener("gmpx-placechange", handler as EventListener);
    };
  }, [onPlaceChanged]);

  return (
    <div className={className}>
      {/* Using ref so we can attach event listeners without React props */}
      {/* eslint-disable-next-line jsx-a11y/aria-props */}
      <gmpx-place-picker ref={ref as unknown as React.RefObject<any>} placeholder={placeholder}></gmpx-place-picker>
    </div>
  );
}

