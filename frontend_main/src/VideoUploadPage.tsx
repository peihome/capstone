"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
const ACCEPTED_VIDEO_TYPES = [
	"video/mp4",
	"video/quicktime",
	"video/x-msvideo",
];

const formSchema = z.object({
	title: z
		.string()
		.max(100, "Title must not exceed 100 characters")
		.optional(),
	description: z
		.string()
		.max(500, "Description must not exceed 500 characters")
		.optional(),
	video: z
		.instanceof(File)
		.refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 1GB.`)
		.refine(
			(file) => ACCEPTED_VIDEO_TYPES.includes(file.type),
			"Only .mp4, .mov, and .avi formats are supported."
		),
});

type FormValues = z.infer<typeof formSchema>;

const backend_PORT = 8000;
const initiateUrl = `http://localhost:${backend_PORT}/initiate`;
const uploadUrl = `http://localhost:${backend_PORT}/upload`;
const completeUrl = `http://localhost:${backend_PORT}/complete`;
const kafkaSendUrl = `http://localhost:8001/send`;

//console.log(backend_PORT);
//console.log(import.meta.env.transcoder_HOST);

export default function VideoUploadPage() {
	const [videoPreview, setVideoPreview] = useState<string | null>(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			description: "",
		},
	});

	const uploadFileInChunks = async (
		file: File,
		onProgress: (progress: number) => void
	) => {
		const chunkSize = 100 * 1024 * 1024; // 100 MB
		const totalChunks = Math.ceil(file.size / chunkSize);
		const uploadPromises = [];
		let uploadId;

		try {
			const response = await axios.post(initiateUrl, {
				fileName: file.name,
			});
			uploadId = response.data.uploadId;
			console.log(uploadId);
		} catch (error) {
			console.error("Failed to initiate multipart upload:", error);
			throw new Error("Failed to initiate upload");
		}

		for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
			const start = chunkIndex * chunkSize;
			const end = Math.min(file.size, start + chunkSize);
			const chunk = file.slice(start, end);

			const formData = new FormData();
			formData.append("chunk", chunk);
			formData.append("chunkIndex", chunkIndex.toString());
			formData.append("totalChunks", totalChunks.toString());
			formData.append("fileName", file.name);
			formData.append("uploadId", uploadId);

			const uploadPromise = uploadChunk(
				formData,
				onProgress,
				chunkIndex,
				totalChunks
			);
			uploadPromises.push(uploadPromise);
		}

		try {
			const responses = await Promise.all(uploadPromises);
			console.log("All chunks uploaded successfully!");

			const parts = responses.map((response, index) => ({
				PartNumber: index + 1,
				ETag: response.ETag,
			}));

			const completeResponse = await axios.post(completeUrl, {
				uploadId,
				fileName: file.name,
				parts: parts,
			});

			const finalETag = completeResponse.data.ETag.replace(/^"|"$/g, "");


			const title = form.getValues('title');
			const description = form.getValues('description');
			const user_id = localStorage.getItem('user_id');

			const messageData = {
				finalETag,
				title,
				description,
				user_id
			};

    		await axios.post(kafkaSendUrl, { message: messageData });
			console.log("Final ETag sent to Kafka!");

			return finalETag;
		} catch (error) {
			console.error(
				"Failed to upload one or more chunks or complete the upload:",
				error
			);
			throw error;
		}
	};

	const uploadChunk = async (
		formData: FormData,
		onProgress: (progress: number) => void,
		chunkIndex: number,
		totalChunks: number
	) => {
		try {
			const response = await axios.post(uploadUrl, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
				onUploadProgress: (progressEvent) => {
					if (progressEvent.total) {
						const progress =
							((chunkIndex + 1) / totalChunks) *
							(progressEvent.loaded / progressEvent.total);
						onProgress(progress);
					}
				},
			});
			return response.data;
		} catch (error) {
			throw error;
		}
	};

	const onSubmit = async (data: FormValues) => {
		setIsUploading(true);
		setUploadProgress(0);
		setUploadError(null);

		try {
			if (!data.video) {
				throw new Error("No video file selected");
			}

			await uploadFileInChunks(data.video, (progress) => {
				setUploadProgress(progress * 100);
			});

			toast({
				title: "Video Uploaded Successfully",
				description:
					"Your video has been uploaded and is being processed.",
			});

			form.reset();
			setVideoPreview(null);
		} catch (error) {
			console.error("Upload error:", error);
			setUploadError(
				"There was an error uploading your video. Please try again."
			);
		} finally {
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
			<Card>
				<CardHeader>
					<CardTitle className="text-3xl font-bold">
						Upload Video
					</CardTitle>
				</CardHeader>
				<CardContent>
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
													className="hidden"
												/>
												<Button
													type="button"
													variant="outline"
													onClick={() =>
														fileInputRef.current?.click()
													}
													disabled={isUploading}
													className="w-full"
												>
													<Upload className="mr-2 h-4 w-4" />{" "}
													Select Video
												</Button>
											</div>
										</FormControl>
										<FormDescription>
											Upload a video file (max 1GB, .mp4,
											.mov, or .avi)
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
										className="w-full max-w-md mx-auto rounded-lg shadow-lg"
									/>
								</div>
							)}

							<FormField
								control={form.control}
								name="title"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Title (Optional)</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter video title"
												{...field}
												disabled={isUploading}
											/>
										</FormControl>
										<FormDescription>
											Give your video a catchy title (max
											100 characters)
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
										<FormLabel>
											Description (Optional)
										</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Describe your video"
												{...field}
												disabled={isUploading}
											/>
										</FormControl>
										<FormDescription>
											Provide a brief description of your
											video (max 500 characters)
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
										{uploadProgress.toFixed(2)}% Uploaded
									</p>
								</div>
							)}

							{uploadError && (
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertTitle>Error</AlertTitle>
									<AlertDescription>
										{uploadError}
									</AlertDescription>
								</Alert>
							)}

							<Button
								type="submit"
								disabled={isUploading}
								className="w-full"
							>
								{isUploading ? "Uploading..." : "Upload Video"}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
