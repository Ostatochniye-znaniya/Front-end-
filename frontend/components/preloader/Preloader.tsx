"use client";

import { useEffect, useState } from "react";

// Страховка: если событие load так и не пришло (зависла картинка, шрифт и т.п.) — всё равно скрываем
const MAX_LOADING_MS = 8000;
// Сколько длится уход лоудера: задержка 0.8s + растворение 1.2s (см. .preloader.is-finished в globals.css)
const FINISH_ANIMATION_MS = 2000;

const SPINNER_SPOKES = 12;

type Phase = "loading" | "finished" | "hidden";

/**
 * Полноэкранный лоудер при загрузке страницы (по мотивам e.mospolytech.ru).
 * Рендерится в корневом layout, поэтому есть уже в HTML с сервера и виден до гидрации.
 * При переходах внутри приложения layout не перемонтируется — лоудер показывается
 * только при полной загрузке/обновлении страницы.
 */
export default function Preloader() {
  const [phase, setPhase] = useState<Phase>("loading");

  useEffect(() => {
    let removeTimer: ReturnType<typeof setTimeout> | undefined;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      setPhase("finished");
      removeTimer = setTimeout(() => setPhase("hidden"), FINISH_ANIMATION_MS);
    };

    const failsafeTimer = setTimeout(finish, MAX_LOADING_MS);

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
    }

    return () => {
      window.removeEventListener("load", finish);
      clearTimeout(failsafeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (phase === "hidden") return null;

  const isLoading = phase === "loading";

  return (
    <div
      className={`preloader${isLoading ? "" : " is-finished"}`}
      role="status"
      aria-live="polite"
      aria-busy={isLoading}
    >
      <img
        className="preloader-logo"
        src="/csh/logo_icon_l.png"
        alt="Проверка остаточных знаний"
        width={512}
        height={512}
        draggable={false}
      />

      {isLoading && (
        <svg className="preloader-spinner" viewBox="0 0 40 40" aria-hidden="true">
          {Array.from({ length: SPINNER_SPOKES }, (_, i) => (
            <rect
              key={i}
              x="18.5"
              y="2"
              width="3"
              height="10"
              rx="1.5"
              fill="currentColor"
              opacity={(i + 1) / SPINNER_SPOKES}
              transform={`rotate(${i * (360 / SPINNER_SPOKES)} 20 20)`}
            />
          ))}
        </svg>
      )}

      <span className="preloader-sr-only">Загрузка…</span>
    </div>
  );
}
