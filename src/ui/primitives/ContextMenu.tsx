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

export function ContextMenu({
  items,
  children,
}: ContextMenuProps): React.JSX.Element {
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [focusIndex, setFocusIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOpen = position !== null;

  const close = useCallback((): void => {
    setPosition(null);
    setFocusIndex(-1);
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent): void => {
      e.preventDefault();
      setPosition({ x: e.clientX, y: e.clientY });
      setFocusIndex(-1);
    },
    [],
  );

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
          setFocusIndex((prev) => (prev + 1) % items.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusIndex((prev) => (prev - 1 + items.length) % items.length);
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

  // Close on outside click
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

    document.addEventListener("click", handleClick);
    return (): void => {
      document.removeEventListener("click", handleClick);
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
              key={item.label}
              role="menuitem"
              tabIndex={-1}
              aria-disabled={item.disabled === true ? "true" : undefined}
              className={[
                styles.item,
                focusIndex === index ? styles.focused : "",
                item.disabled === true ? styles.disabled : "",
              ].filter(Boolean).join(" ")}
              onClick={() => { handleItemClick(item); }}
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
