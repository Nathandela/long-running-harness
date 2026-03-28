import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./ContextMenu.module.css";

export type MenuItem = {
  label: string;
  action: () => void;
  shortcut?: string;
  disabled?: boolean;
};

export type ContextMenuProps = {
  items: MenuItem[];
  children: React.ReactNode;
};

type MenuPosition = {
  x: number;
  y: number;
};

function findNextEnabledIndex(
  items: MenuItem[],
  current: number,
  direction: 1 | -1,
): number {
  const len = items.length;
  for (let i = 1; i <= len; i++) {
    const idx = (current + i * direction + len) % len;
    if (items[idx]?.disabled !== true) return idx;
  }
  return current;
}

function clampToViewport(
  menu: HTMLDivElement,
  pos: MenuPosition,
): MenuPosition {
  const rect = menu.getBoundingClientRect();
  return {
    x: Math.min(pos.x, window.innerWidth - rect.width),
    y: Math.min(pos.y, window.innerHeight - rect.height),
  };
}

export function ContextMenu({
  items,
  children,
}: ContextMenuProps): React.JSX.Element {
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [focusIndex, setFocusIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const rawPositionRef = useRef<MenuPosition | null>(null);

  const isOpen = position !== null;

  const close = useCallback((): void => {
    setPosition(null);
    setFocusIndex(-1);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent): void => {
    e.preventDefault();
    const raw = { x: e.clientX, y: e.clientY };
    rawPositionRef.current = raw;
    setPosition(raw);
    setFocusIndex(-1);
  }, []);

  // Clamp position after menu renders
  useEffect(() => {
    if (isOpen && menuRef.current != null && rawPositionRef.current != null) {
      const clamped = clampToViewport(menuRef.current, rawPositionRef.current);
      if (
        clamped.x !== rawPositionRef.current.x ||
        clamped.y !== rawPositionRef.current.y
      ) {
        setPosition(clamped);
      }
      rawPositionRef.current = null;
    }
  }, [isOpen]);

  const handleItemClick = useCallback(
    (item: MenuItem): void => {
      if (item.disabled === true) return;
      item.action();
      close();
    },
    [close],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      switch (e.key) {
        case "Escape":
          close();
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusIndex((prev) => findNextEnabledIndex(items, prev, 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusIndex((prev) => findNextEnabledIndex(items, prev, -1));
          break;
        case "Enter": {
          e.preventDefault();
          const item = items[focusIndex];
          if (item != null && item.disabled !== true) {
            item.action();
            close();
          }
          break;
        }
      }
    },
    [close, focusIndex, items],
  );

  // Close on outside click or right-click elsewhere
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent): void => {
      if (
        menuRef.current != null &&
        !menuRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };

    const handleOuterContextMenu = (): void => {
      close();
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("contextmenu", handleOuterContextMenu);
    return (): void => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("contextmenu", handleOuterContextMenu);
    };
  }, [isOpen, close]);

  // Focus menu when it opens
  useEffect(() => {
    if (isOpen && menuRef.current != null) {
      menuRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div onContextMenu={handleContextMenu}>
      {children}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          tabIndex={-1}
          className={styles.menu}
          style={{ left: position.x, top: position.y }}
          onKeyDown={handleKeyDown}
        >
          {items.map((item, index) => (
            <div
              key={`${String(index)}-${item.label}`}
              role="menuitem"
              tabIndex={-1}
              aria-disabled={item.disabled === true ? "true" : undefined}
              className={[
                styles.item,
                focusIndex === index ? styles.focused : "",
                item.disabled === true ? styles.disabled : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                handleItemClick(item);
              }}
            >
              <span className={styles.label}>{item.label}</span>
              {item.shortcut != null && (
                <span className={styles.shortcut}>{item.shortcut}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
