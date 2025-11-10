import { Undo2, Redo2, RotateCcw, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

export default function BottomBar({
                                      zoom,
                                      onZoomChange,
                                      onUndo,
                                      onRedo,
                                      onResetAll,
                                      onExport,
                                      canUndo,
                                      canRedo,
                                  }) {
    return (
        <div
            className="h-14 glass-panel border-t flex items-center justify-between px-6"
            style={{ borderColor: 'var(--editor-border)' }}
        >
            {/* Left Section - History Controls */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                        !canUndo ? 'cursor-not-allowed' : ''
                    }`}
                    style={{
                        backgroundColor: canUndo ? 'rgba(31, 111, 235, 0.2)' : 'rgba(31, 111, 235, 0.1)',
                        color: canUndo ? 'var(--editor-text)' : 'var(--editor-text-muted)',
                    }}
                    onMouseEnter={(e) => {
                        if (canUndo) e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        if (canUndo) e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.2)';
                    }}
                    title="Undo"
                >
                    <Undo2 className="w-4 h-4" />
                </button>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                        !canRedo ? 'cursor-not-allowed' : ''
                    }`}
                    style={{
                        backgroundColor: canRedo ? 'rgba(31, 111, 235, 0.2)' : 'rgba(31, 111, 235, 0.1)',
                        color: canRedo ? 'var(--editor-text)' : 'var(--editor-text-muted)',
                    }}
                    onMouseEnter={(e) => {
                        if (canRedo) e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        if (canRedo) e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.2)';
                    }}
                    title="Redo"
                >
                    <Redo2 className="w-4 h-4" />
                </button>
                <Separator
                    orientation="vertical"
                    className="h-6 mx-2"
                    style={{ backgroundColor: 'rgba(31, 111, 235, 0.3)' }}
                />
                <button
                    onClick={onResetAll}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                    style={{
                        backgroundColor: 'rgba(31, 111, 235, 0.2)',
                        color: 'var(--editor-text)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.4)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.2)')}
                    title="Reset All"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>

            {/* Center Section - Zoom */}
            <div className="flex items-center gap-2">
                <span style={{ color: 'var(--editor-text-muted)' }}>Zoom:</span>
                <Select value={zoom.toString()} onValueChange={(value) => onZoomChange(Number(value))}>
                    <SelectTrigger
                        className="w-32"
                        style={{
                            backgroundColor: 'rgba(31, 111, 235, 0.1)',
                            borderColor: 'rgba(31, 111, 235, 0.3)',
                            color: 'var(--editor-text)',
                        }}
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                        className="glass-panel"
                        style={{
                            borderColor: 'rgba(31, 111, 235, 0.3)',
                            backgroundColor: 'var(--editor-panel)',
                        }}
                    >
                        <SelectItem value="25" style={{ color: 'var(--editor-text)' }}>25%</SelectItem>
                        <SelectItem value="50" style={{ color: 'var(--editor-text)' }}>50%</SelectItem>
                        <SelectItem value="75" style={{ color: 'var(--editor-text)' }}>75%</SelectItem>
                        <SelectItem value="100" style={{ color: 'var(--editor-text)' }}>100%</SelectItem>
                        <SelectItem value="125" style={{ color: 'var(--editor-text)' }}>125%</SelectItem>
                        <SelectItem value="150" style={{ color: 'var(--editor-text)' }}>150%</SelectItem>
                        <SelectItem value="200" style={{ color: 'var(--editor-text)' }}>200%</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Right Section - Export */}
            <Button
                onClick={onExport}
                className="text-white neon-glow-cyan gap-2"
                style={{
                    background: 'linear-gradient(to right, var(--editor-neon-blue), var(--editor-neon-cyan))',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
                <Download className="w-4 h-4" />
                Export
            </Button>
        </div>
    );
}