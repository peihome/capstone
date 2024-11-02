import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ACCEPTED_VIDEO_TYPES = [
	"video/mp4",
	"video/quicktime",
	"video/x-msvideo",
];

const formSchema = z.object({
	title: z
		.string()
		.min(3, "Title must be at least 3 characters")
		.max(100, "Title must not exceed 100 characters"),
	description: z
		.string()
		.max(500, "Description must not exceed 500 characters"),
	video: z
		.instanceof(File)
		.refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 100MB.`)
		.refine(
			(file) => ACCEPTED_VIDEO_TYPES.includes(file.type),
			"Only .mp4, .mov, and .avi formats are supported."
		),
});

type FormValues = z.infer<typeof formSchema>;

export default function VideoUploadPage() {
	const [videoPreview, setVideoPreview] = useState<string | null>(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			description: "",
		},
	});

	const onSubmit = async (data: FormValues) => {
		setIsUploading(true);
		setUploadProgress(0);

		// Simulating file upload with progress
		const totalSteps = 100;
		for (let i = 0; i <= totalSteps; i++) {
			await new Promise((resolve) => setTimeout(resolve, 50));
			setUploadProgress(i);
		}

		// Mock API call
		try {
			// Replace this with your actual API endpoint
			const response = await fetch("/api/upload-video", {
				method: "POST",
				body: JSON.stringify(data),
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error("Upload failed");
			}

			toast({
				title: "Video Uploaded Successfully",
				description:
					"Your video has been uploaded and is being processed.",
			});

			// Reset form and states
			form.reset();
			setVideoPreview(null);
			setIsUploading(false);
			setUploadProgress(0);
		} catch (error) {
			console.error("Upload error:", error);
			toast({
				title: "Upload Failed",
				description:
					"There was an error uploading your video. Please try again.",
				variant: "destructive",
			});
			setIsUploading(false);
		}
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			form.setValue("video", file);
			const videoUrl = URL.createObjectURL(file);
			setVideoPreview(videoUrl);
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Upload Video</h1>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-8"
				>
					<FormField
						control={form.control}
						name="video"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Video File</FormLabel>
								<FormControl>
									<div className="flex items-center space-x-4">
										<Input
											type="file"
											accept="video/*"
											onChange={handleFileChange}
											ref={fileInputRef}
											disabled={isUploading}
										/>
										<Button
											type="button"
											variant="outline"
											onClick={() =>
												fileInputRef.current?.click()
											}
											disabled={isUploading}
										>
											Select Video
										</Button>
									</div>
								</FormControl>
								<FormDescription>
									Upload a video file (max 100MB, .mp4, .mov,
									or .avi)
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					{videoPreview && (
						<div className="mt-4">
							<video
								src={videoPreview}
								controls
								className="w-full max-w-md mx-auto"
							/>
						</div>
					)}

					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Title</FormLabel>
								<FormControl>
									<Input
										placeholder="Enter video title"
										{...field}
										disabled={isUploading}
									/>
								</FormControl>
								<FormDescription>
									Give your video a catchy title (3-100
									characters)
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Describe your video"
										{...field}
										disabled={isUploading}
									/>
								</FormControl>
								<FormDescription>
									Provide a brief description of your video
									(max 500 characters)
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					{isUploading && (
						<div className="mt-4">
							<Progress
								value={uploadProgress}
								className="w-full"
							/>
							<p className="text-center mt-2">
								{uploadProgress}% Uploaded
							</p>
						</div>
					)}

					<Button type="submit" disabled={isUploading}>
						{isUploading ? "Uploading..." : "Upload Video"}
					</Button>
				</form>
			</Form>
		</div>
	);
}
