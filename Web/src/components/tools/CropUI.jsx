import { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';

// Canvas.jsx - Key improvements for crop functionality:
// 1. Fixed coordinate scaling between display and natural image size
// 2. Added proper boundary checking
// 3. Improved canvas rendering after crop
// 4. Better image state management

export default function CropUI({ width, height, onApply, onCancel }) {
    const [crop, setCrop] = useState({
        x: width * 0.1,
        y: height * 0.1,
        width: width * 0.8,
        height: height * 0.8,
    });
    const [dragging, setDragging] = useState(null);
    const startPos = useRef({ x: 0, y: 0, crop: null });

    // Update crop when container dimensions change
    useEffect(() => {
        setCrop({
            x: width * 0.1,
            y: height * 0.1,
            width: width * 0.8,
            height: height * 0.8,
        });
    }, [width, height]);

    const handleMouseDown = (e, handle) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(handle);
        startPos.current = {
            x: e.clientX,
            y: e.clientY,
            crop: { ...crop },
        };
    };

    const handleMouseMove = (e) => {
        if (!dragging) return;

        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;
        const startCrop = startPos.current.crop;

        let newCrop = { ...crop };

        switch (dragging) {
            case 'move':
                newCrop.x = Math.max(0, Math.min(width - startCrop.width, startCrop.x + dx));
                newCrop.y = Math.max(0, Math.min(height - startCrop.height, startCrop.y + dy));
                break;
            case 'nw':
                const nwDx = Math.min(dx, startCrop.width - 50);
                const nwDy = Math.min(dy, startCrop.height - 50);
                newCrop.x = Math.max(0, startCrop.x + nwDx);
                newCrop.y = Math.max(0, startCrop.y + nwDy);
                newCrop.width = startCrop.width - (newCrop.x - startCrop.x);
                newCrop.height = startCrop.height - (newCrop.y - startCrop.y);
                break;
            case 'ne':
                const neDy = Math.min(dy, startCrop.height - 50);
                newCrop.y = Math.max(0, startCrop.y + neDy);
                newCrop.width = Math.max(50, Math.min(width - startCrop.x, startCrop.width + dx));
                newCrop.height = startCrop.height - (newCrop.y - startCrop.y);
                break;
            case 'sw':
                const swDx = Math.min(dx, startCrop.width - 50);
                newCrop.x = Math.max(0, startCrop.x + swDx);
                newCrop.width = startCrop.width - (newCrop.x - startCrop.x);
                newCrop.height = Math.max(50, Math.min(height - startCrop.y, startCrop.height + dy));
                break;
            case 'se':
                newCrop.width = Math.max(50, Math.min(width - startCrop.x, startCrop.width + dx));
                newCrop.height = Math.max(50, Math.min(height - startCrop.y, startCrop.height + dy));
                break;
            default:
                break;
        }

        // Ensure minimum size
        if (newCrop.width < 50) newCrop.width = 50;
        if (newCrop.height < 50) newCrop.height = 50;

        // Ensure within bounds
        if (newCrop.x + newCrop.width > width) {
            newCrop.width = width - newCrop.x;
        }
        if (newCrop.y + newCrop.height > height) {
            newCrop.height = height - newCrop.y;
        }

        setCrop(newCrop);
    };

    const handleMouseUp = () => {
        setDragging(null);
    };

    useEffect(() => {
        if (dragging) {
            const handleGlobalMove = (e) => handleMouseMove(e);
            const handleGlobalUp = () => handleMouseUp();

            window.addEventListener('mousemove', handleGlobalMove);
            window.addEventListener('mouseup', handleGlobalUp);

            return () => {
                window.removeEventListener('mousemove', handleGlobalMove);
                window.removeEventListener('mouseup', handleGlobalUp);
            };
        }
    }, [dragging, crop, width, height]);

    return (
        <div className="absolute inset-0 cursor-move select-none">
            {/* Crop area with cutout effect */}
            <div
                className="absolute border-2 border-white bg-transparent"
                style={{
                    left: crop.x,
                    top: crop.y,
                    width: crop.width,
                    height: crop.height,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                }}
                onMouseDown={(e) => {
                    e.preventDefault();
                    handleMouseDown(e, 'move');
                }}
            >
                {/* Grid lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    {[...Array(9)].map((_, i) => (
                        <div key={i} className="border border-white border-opacity-30" />
                    ))}
                </div>

                {/* Corner Handles */}
                <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize hover:scale-125 transition-transform"
                    style={{ left: -8, top: -8 }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        handleMouseDown(e, 'nw');
                    }}
                />
                <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize hover:scale-125 transition-transform"
                    style={{ right: -8, top: -8 }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        handleMouseDown(e, 'ne');
                    }}
                />
                <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize hover:scale-125 transition-transform"
                    style={{ left: -8, bottom: -8 }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        handleMouseDown(e, 'sw');
                    }}
                />
                <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-se-resize hover:scale-125 transition-transform"
                    style={{ right: -8, bottom: -8 }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        handleMouseDown(e, 'se');
                    }}
                />

                {/* Dimension display */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-none">
                    {Math.round(crop.width)} × {Math.round(crop.height)}
                </div>
            </div>

            {/* Action buttons */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onApply(crop);
                    }}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 hover:bg-green-600 transition-colors shadow-lg font-medium"
                >
                    <Check className="w-4 h-4" />
                    Apply Crop
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onCancel();
                    }}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg flex items-center gap-2 hover:bg-red-600 transition-colors shadow-lg font-medium"
                >
                    <X className="w-4 h-4" />
                    Cancel
                </button>
            </div>
        </div>
    );
}