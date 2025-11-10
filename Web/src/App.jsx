import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LeftSidebar from './components/LeftSidebar';
import Canvas from './components/Canvas';
import RightPanel from './components/RightPanel';
import BottomBar from './components/BottomBar';
import SteganographyModal from './components/SteganographyModal';
import { Toaster } from "sonner"
import { toast } from 'sonner';

export default function App() {
    const [darkMode, setDarkMode] = useState(false);
    const [selectedTool, setSelectedTool] = useState('');
    const [imageUrl, setImageUrl] = useState(null);
    const [zoom, setZoom] = useState(100);
    const [properties, setProperties] = useState({
        aspectRatio: 'free',
        filter: 'none',
        brightness: 0,
        contrast: 0,
        saturation: 0,
        textContent: '',
        fontSize: 24,
    });
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [showSteganographyModal, setShowSteganographyModal] = useState(false);

    // Apply dark theme to document
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            document.body.style.backgroundColor = '#0D1117';
        } else {
            document.documentElement.classList.remove('dark');
            document.body.style.backgroundColor = '#ffffff';
        }
    }, [darkMode]);

    // Open steganography modal when tool is selected
    useEffect(() => {
        if (selectedTool === 'steganography') {
            setShowSteganographyModal(true);
        }
    }, [selectedTool]);

    const handleImageUpload = (file) => {
        const url = URL.createObjectURL(file);
        setImageUrl(url);
        toast.success('Image uploaded successfully!', {
            description: 'You can now start editing your image.',
        });
    };

    const handleImageChange = (newUrl) => {
        setImageUrl(newUrl);
        toast.success('Image updated!', {
            description: 'Changes have been applied to your image.',
        });
    };

    const handlePropertyChange = (key, value) => {
        setProperties(prev => ({ ...prev, [key]: value }));
    };

    const handleApply = () => {
        toast.success('Changes applied!', {
            description: 'Your adjustments have been applied to the image.',
        });
        // Add to history
        setHistory(prev => [...prev.slice(0, historyIndex + 1), { properties, imageUrl }]);
        setHistoryIndex(prev => prev + 1);
    };

    const handleReset = () => {
        setProperties({
            aspectRatio: 'free',
            filter: 'none',
            brightness: 0,
            contrast: 0,
            saturation: 0,
            textContent: '',
            fontSize: 24,
        });
        toast.info('Properties reset', {
            description: 'All properties have been reset to default values.',
        });
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            const previousState = history[historyIndex - 1];
            setProperties(previousState.properties);
            setImageUrl(previousState.imageUrl);
            toast.info('Undo', { description: 'Previous state restored.' });
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            const nextState = history[historyIndex + 1];
            setProperties(nextState.properties);
            setImageUrl(nextState.imageUrl);
            toast.info('Redo', { description: 'Next state restored.' });
        }
    };

    const handleResetAll = () => {
        setProperties({
            aspectRatio: 'free',
            filter: 'none',
            brightness: 0,
            contrast: 0,
            saturation: 0,
            textContent: '',
            fontSize: 24,
        });
        setSelectedTool('');
        toast.success('Reset complete', {
            description: 'All changes have been reset.',
        });
    };

    const handleExport = () => {
        if (!imageUrl) {
            toast.error('No image to export', {
                description: 'Please upload an image first.',
            });
            return;
        }

        toast.promise(
            new Promise((resolve) => {
                // Create a download link
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = `edited-image-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(resolve, 1500);
            }),
            {
                loading: 'Exporting image...',
                success: 'Image exported successfully!',
                error: 'Failed to export image',
            }
        );
    };

    const handleToolSelect = (tool) => {
        setSelectedTool(tool);
        if (tool === 'steganography') {
            setShowSteganographyModal(true);
        }
    };

    const handleToolReset = () => {
        setSelectedTool('');
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--editor-bg)' }}>
            {/* Top Navbar */}
            <Navbar darkMode={darkMode} onDarkModeToggle={() => setDarkMode(!darkMode)} />

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <LeftSidebar selectedTool={selectedTool} onToolSelect={handleToolSelect} />

                {/* Canvas */}
                <Canvas
                    imageUrl={imageUrl}
                    onImageUpload={handleImageUpload}
                    onImageChange={handleImageChange}
                    zoom={zoom}
                    onZoomChange={setZoom}
                    selectedTool={selectedTool}
                    onToolReset={handleToolReset}
                    properties={properties}
                />

                {/* Right Panel */}
                <RightPanel
                    selectedTool={selectedTool}
                    properties={properties}
                    onPropertyChange={handlePropertyChange}
                    onApply={handleApply}
                    onReset={handleReset}
                />
            </div>

            {/* Bottom Bar */}
            <BottomBar
                zoom={zoom}
                onZoomChange={setZoom}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onResetAll={handleResetAll}
                onExport={handleExport}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
            />

            {/* Steganography Modal */}
            <SteganographyModal
                open={showSteganographyModal}
                onOpenChange={(open) => {
                    setShowSteganographyModal(open);
                    if (!open && selectedTool === 'steganography') {
                        setSelectedTool('');
                    }
                }}
            />

            {/* Toast Notifications */}
            <Toaster theme={darkMode ? 'dark' : 'light'} position="bottom-right" />
        </div>
    );
}