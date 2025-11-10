import { Upload, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import CropUI from './tools/CropUI';

function Canvas({ imageUrl, onImageUpload, zoom, onZoomChange, selectedTool, onToolReset, onImageChange, properties }) {
    const fileInputRef = useRef(null);
    const imgRef = useRef(null);
    const canvasRef = useRef(null);

    const [isDragging, setIsDragging] = useState(false);
    const [natural, setNatural] = useState({ w: 0, h: 0 });
    const [fitBase, setFitBase] = useState({ w: 0, h: 0 });
    const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

    const containerRef = useRef(null);

    // Measure container
    useEffect(() => {
        const measure = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            setContainerSize({ w: rect.width, h: rect.height });
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    // When image loads, capture natural size and compute base fit
    useEffect(() => {
        if (!imageUrl) {
            setNatural({ w: 0, h: 0 });
            setFitBase({ w: 0, h: 0 });
            return;
        }
        const img = new Image();
        img.onload = () => {
            const natW = img.naturalWidth;
            const natH = img.naturalHeight;
            setNatural({ w: natW, h: natH });

            const pad = 48;
            const maxW = Math.max(100, containerSize.w - pad);
            const maxH = Math.max(100, containerSize.h - pad - 80);
            const scale = Math.min(maxW / natW, maxH / natH, 1);
            setFitBase({ w: Math.floor(natW * scale), h: Math.floor(natH * scale) });
        };
        img.src = imageUrl;
    }, [imageUrl, containerSize.w, containerSize.h]);

    // Display size with zoom
    const display = useMemo(() => {
        return {
            w: Math.floor(fitBase.w * (zoom / 100)),
            h: Math.floor(fitBase.h * (zoom / 100)),
        };
    }, [fitBase, zoom]);

    // Apply filters and adjustments to canvas
    useEffect(() => {
        if (!imageUrl || !imgRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = imgRef.current;

        canvas.width = display.w;
        canvas.height = display.h;

        // Apply filter CSS
        let filterStr = '';
        if (properties.brightness !== 0) {
            filterStr += `brightness(${100 + properties.brightness}%) `;
        }
        if (properties.contrast !== 0) {
            filterStr += `contrast(${100 + properties.contrast}%) `;
        }
        if (properties.saturation !== 0) {
            filterStr += `saturate(${100 + properties.saturation}%) `;
        }

        // Apply preset filters
        switch (properties.filter) {
            case 'grayscale':
                filterStr += 'grayscale(100%) ';
                break;
            case 'sepia':
                filterStr += 'sepia(100%) ';
                break;
            case 'vintage':
                filterStr += 'sepia(50%) contrast(110%) brightness(90%) ';
                break;
            case 'neon':
                filterStr += 'contrast(150%) saturate(200%) brightness(110%) ';
                break;
            case 'cool':
                filterStr += 'hue-rotate(180deg) saturate(150%) ';
                break;
            default:
                break;
        }

        ctx.filter = filterStr;
        ctx.drawImage(img, 0, 0, display.w, display.h);

        // Add text if present
        if (properties.textContent && selectedTool === 'text') {
            ctx.filter = 'none';
            ctx.font = `${properties.fontSize}px Arial`;
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.textAlign = 'center';
            ctx.strokeText(properties.textContent, display.w / 2, display.h / 2);
            ctx.fillText(properties.textContent, display.w / 2, display.h / 2);
        }
    }, [imageUrl, display, properties, selectedTool]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            onImageUpload(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            onImageUpload(file);
        }
    };

    // Perform crop
    const applyCrop = async ({ x, y, width, height }) => {
        if (!imgRef.current || !natural.w || !display.w) return;

        // Calculate scale factors from display size to natural size
        const scaleX = natural.w / display.w;
        const scaleY = natural.h / display.h;

        // Convert crop coordinates from display space to natural image space
        const sx = Math.max(0, Math.floor(x * scaleX));
        const sy = Math.max(0, Math.floor(y * scaleY));
        const sw = Math.min(natural.w - sx, Math.floor(width * scaleX));
        const sh = Math.min(natural.h - sy, Math.floor(height * scaleY));

        // Ensure we have valid dimensions
        if (sw <= 0 || sh <= 0) {
            console.error('Invalid crop dimensions');
            return;
        }

        const src = imgRef.current;

        // Create offscreen canvas at natural resolution
        const off = document.createElement('canvas');
        off.width = sw;
        off.height = sh;
        const ctx = off.getContext('2d');

        // Draw cropped portion
        ctx.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);

        // Convert to data URL and update image
        const dataUrl = off.toDataURL('image/png');
        onImageChange(dataUrl);
        onToolReset?.();
    };

    return (
        <div className="flex-1 flex flex-col relative" style={{ backgroundColor: 'var(--editor-bg)' }}>
            <div ref={containerRef} className="flex-1 flex items-center justify-center p-8">
                {!imageUrl ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`w-full max-w-2xl h-96 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 ${
                            isDragging ? 'pulse-glow' : ''
                        }`}
                        style={{
                            borderColor: isDragging ? 'var(--editor-neon-cyan)' : 'var(--editor-neon-blue)',
                            backgroundColor: isDragging ? 'rgba(31, 111, 235, 0.05)' : 'transparent'
                        }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        onMouseEnter={(e) => {
                            if (!isDragging) {
                                e.currentTarget.style.borderColor = 'var(--editor-neon-cyan)';
                                e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.05)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isDragging) {
                                e.currentTarget.style.borderColor = 'var(--editor-neon-blue)';
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }
                        }}
                    >
                        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(31, 111, 235, 0.2)' }}>
                            <Upload className="w-8 h-8" style={{ color: 'var(--editor-neon-blue)' }} />
                        </div>
                        <div className="text-center">
                            <p className="mb-2" style={{ color: 'var(--editor-text)' }}>Drop your image here or click to upload</p>
                            <p style={{ color: 'var(--editor-text-muted)' }}>PNG, JPG, GIF up to 10MB</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
                        {/* Hidden original image for processing */}
                        <img
                            ref={imgRef}
                            src={imageUrl}
                            alt="Original"
                            style={{ display: 'none' }}
                        />

                        {/* Displayed canvas with filters */}
                        <canvas
                            ref={canvasRef}
                            className="rounded-lg shadow-2xl"
                            style={{ display: 'block' }}
                        />

                        {/* Crop overlay */}
                        {selectedTool === 'crop' && (
                            <div
                                className="absolute top-0 left-0"
                                style={{ width: `${display.w}px`, height: `${display.h}px` }}
                            >
                                <CropUI
                                    width={display.w}
                                    height={display.h}
                                    onApply={applyCrop}
                                    onCancel={onToolReset}
                                />
                            </div>
                        )}
                    </motion.div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {/* Zoom Controls */}
            {imageUrl && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2 glass-panel px-4 py-2 flex items-center gap-3"
                >
                    <button
                        onClick={() => onZoomChange(Math.max(25, zoom - 25))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                        style={{ backgroundColor: 'rgba(31, 111, 235, 0.2)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.4)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.2)'}
                    >
                        <ZoomOut className="w-4 h-4" style={{ color: 'var(--editor-text)' }} />
                    </button>
                    <span className="min-w-[60px] text-center" style={{ color: 'var(--editor-text)' }}>{zoom}%</span>
                    <button
                        onClick={() => onZoomChange(Math.min(300, zoom + 25))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                        style={{ backgroundColor: 'rgba(31, 111, 235, 0.2)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.4)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(31, 111, 235, 0.2)'}
                    >
                        <ZoomIn className="w-4 h-4" style={{ color: 'var(--editor-text)' }} />
                    </button>
                </motion.div>
            )}
        </div>
    );
}

export default Canvas;