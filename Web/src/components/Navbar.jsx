import { Moon, Sun, Image as ImageIcon } from 'lucide-react';

export default function Navbar({ darkMode, onDarkModeToggle }) {
    return (
        <nav
            className="h-16 glass-panel border-b flex items-center justify-between px-6"
            style={{ borderColor: 'var(--editor-border)' }}
        >
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(31, 111, 235, 0.2)' }}
                >
                    <ImageIcon className="w-6 h-6" style={{ color: 'var(--editor-neon-blue)' }} />
                </div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--editor-text)' }}>
                    Image Editor
                </h1>
            </div>

            <button
                onClick={onDarkModeToggle}
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                style={{ backgroundColor: 'rgba(31, 111, 235, 0.2)' }}
                onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.4)')
                }
                onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.2)')
                }
            >
                {darkMode ? (
                    <Sun className="w-5 h-5" style={{ color: 'var(--editor-text)' }} />
                ) : (
                    <Moon className="w-5 h-5" style={{ color: 'var(--editor-text)' }} />
                )}
            </button>
        </nav>
    );
}