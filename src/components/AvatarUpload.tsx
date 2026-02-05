import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { api } from '../services/api';
import { UploadIcon, XIcon, UserIcon } from '../components/icons';

interface AvatarUploadProps {
    currentAvatarUrl?: string;
    onUploadSuccess: (newAvatarUrl: string) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ currentAvatarUrl, onUploadSuccess }) => {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [preview, setPreview] = useState<string | null>(api.getImageUrl(currentAvatarUrl || null));
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
            showToast('Only PNG, JPEG, and JPG images are allowed', 'error');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('File size must be less than 5MB', 'error');
            return;
        }

        setSelectedFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFile || !token) return;

        setUploading(true);
        try {
            const result: any = await api.uploadAvatar(token, selectedFile);
            onUploadSuccess(result.avatarUrl);
            setPreview(api.getImageUrl(result.avatarUrl));
            showToast('Avatar updated successfully!', 'success');
            setSelectedFile(null);
        } catch (error: any) {
            showToast(error.message || 'Failed to upload avatar', 'error');
            setPreview(api.getImageUrl(currentAvatarUrl || null));
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = async () => {
        if (!token) return;

        try {
            await api.deleteAvatar(token);
            setPreview(null);
            setSelectedFile(null);
            onUploadSuccess('');
            showToast('Avatar removed', 'success');
        } catch (error) {
            showToast('Failed to remove avatar', 'error');
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Avatar Preview */}
            <div className="relative">
                {preview ? (
                    <img
                        src={preview}
                        alt="Profile avatar"
                        className="w-32 h-32 rounded-full object-cover border-4 border-accent-yellow"
                    />
                ) : (
                    <div className="w-32 h-32 rounded-full bg-surface-highlight border-4 border-border flex items-center justify-center">
                        <UserIcon size={48} className="text-text-secondary" />
                    </div>
                )}

                {preview && (
                    <button
                        onClick={handleRemove}
                        className="absolute top-0 right-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Remove avatar"
                    >
                        <XIcon size={16} className="text-white" />
                    </button>
                )}
            </div>

            {/* Upload Button / Progress */}
            <div className="flex flex-col items-center gap-2">
                <label
                    htmlFor="avatar-upload"
                    className="btn-secondary cursor-pointer flex items-center gap-2"
                >
                    <UploadIcon size={16} />
                    Choose Image
                </label>
                <input
                    id="avatar-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {selectedFile && (
                    <motion.button
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={handleUpload}
                        disabled={uploading}
                        className="btn-primary"
                    >
                        {uploading ? 'Uploading...' : 'Save Avatar'}
                    </motion.button>
                )}

                <p className="text-xs text-text-secondary text-center">
                    PNG, JPEG, JPG only. Max 5MB.
                </p>
            </div>
        </div>
    );
};
