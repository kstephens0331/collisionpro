"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Camera,
  Upload,
  X,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Pencil,
} from "lucide-react";
import PhotoMarkup from "./PhotoMarkup";

interface Photo {
  id: string;
  url: string;
  category: string;
  caption: string | null;
  createdAt: string;
}

interface PhotoUploadProps {
  estimateId: string;
  photos: Photo[];
  onPhotosChange: () => void;
}

export default function PhotoUpload({
  estimateId,
  photos,
  onPhotosChange,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("damage");
  const [caption, setCaption] = useState("");
  const [selectedPhotoForMarkup, setSelectedPhotoForMarkup] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { value: "damage", label: "Damage Photos" },
    { value: "progress", label: "Progress Photos" },
    { value: "completed", label: "Completed Photos" },
  ];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", selectedCategory);
        formData.append("caption", caption);

        const response = await fetch(`/api/estimates/${estimateId}/photos`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!data.success) {
          alert(`Failed to upload ${file.name}: ${data.error}`);
        }
      }

      // Refresh photos
      onPhotosChange();
      setShowUpload(false);
      setCaption("");

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload photos");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      const response = await fetch(
        `/api/estimates/${estimateId}/photos?photoId=${photoId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (data.success) {
        onPhotosChange();
      } else {
        alert(`Failed to delete photo: ${data.error}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete photo");
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find((c) => c.value === category);
    return cat ? cat.label : category;
  };

  const groupedPhotos = {
    damage: photos.filter((p) => p.category === "damage"),
    progress: photos.filter((p) => p.category === "progress"),
    completed: photos.filter((p) => p.category === "completed"),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photos ({photos.length})
          </CardTitle>
          <Button size="sm" onClick={() => setShowUpload(!showUpload)}>
            {showUpload ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Photos
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Upload Form */}
        {showUpload && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="caption">Caption (optional)</Label>
                <Input
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g., Front bumper damage"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="photos">Select Photos</Label>
              <div className="mt-1">
                <input
                  ref={fileInputRef}
                  id="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  disabled={uploading}
                />
              </div>
              {uploading && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Photo Gallery */}
        {photos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No photos uploaded yet</p>
            <p className="text-sm mt-1">
              Click "Upload Photos" to add vehicle photos
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Damage Photos */}
            {groupedPhotos.damage.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Damage Photos</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupedPhotos.damage.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative group rounded-lg overflow-hidden border"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || "Damage photo"}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={() => setSelectedPhotoForMarkup(photo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={() => handleDelete(photo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {photo.caption && (
                        <p className="text-xs p-2 bg-gray-50 truncate">
                          {photo.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Photos */}
            {groupedPhotos.progress.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Progress Photos</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupedPhotos.progress.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative group rounded-lg overflow-hidden border"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || "Progress photo"}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={() => setSelectedPhotoForMarkup(photo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={() => handleDelete(photo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {photo.caption && (
                        <p className="text-xs p-2 bg-gray-50 truncate">
                          {photo.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Photos */}
            {groupedPhotos.completed.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Completed Photos</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupedPhotos.completed.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative group rounded-lg overflow-hidden border"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || "Completed photo"}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={() => setSelectedPhotoForMarkup(photo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={() => handleDelete(photo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {photo.caption && (
                        <p className="text-xs p-2 bg-gray-50 truncate">
                          {photo.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Photo Markup Modal */}
      {selectedPhotoForMarkup && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Annotate Photo
                {selectedPhotoForMarkup.caption && ` - ${selectedPhotoForMarkup.caption}`}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPhotoForMarkup(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <PhotoMarkup
                imageUrl={selectedPhotoForMarkup.url}
                estimateId={estimateId}
                photoId={selectedPhotoForMarkup.id}
                onSave={() => {
                  setSelectedPhotoForMarkup(null);
                  onPhotosChange();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
