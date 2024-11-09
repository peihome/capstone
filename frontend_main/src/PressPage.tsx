import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Download, Users, Video } from "lucide-react";

export default function Press() {
	const pressReleases = [
		{
			date: "March 15, 2024",
			title: "Nexstream Reaches 500 Million Active Users",
			description:
				"Nexstream announces a major milestone in its growth, reaching 500 million active users worldwide.",
		},
		{
			date: "February 28, 2024",
			title: "New Creator Tools Launch",
			description:
				"Nexstream introduces advanced editing and analytics tools for content creators.",
		},
		{
			date: "January 10, 2024",
			title: "Nexstream Expands to New Markets",
			description:
				"Platform launches in 15 new countries, bringing total market presence to over 190 countries.",
		},
	];

	return (
		<div className="container mx-auto px-4 py-12">
			<div className="max-w-3xl mx-auto text-center mb-16">
				<h1 className="text-4xl font-bold mb-6">Press & Creators</h1>
				<p className="text-xl text-muted-foreground">
					Latest news, press resources, and creator opportunities
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-12 mb-20">
				<div>
					<h2 className="text-3xl font-bold mb-6">Press Resources</h2>
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Press Kit</CardTitle>
								<CardDescription>
									Download official logos, brand guidelines,
									and media assets
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button variant="outline" className="w-full">
									<Download className="mr-2 h-4 w-4" />{" "}
									Download Press Kit
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Media Inquiries</CardTitle>
								<CardDescription>
									For press-related questions and interview
									requests
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button variant="outline" className="w-full">
									Contact Press Team
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>

				<div>
					<h2 className="text-3xl font-bold mb-6">
						Latest Press Releases
					</h2>
					<div className="space-y-4">
						{pressReleases.map((release, index) => (
							<Card key={index}>
								<CardHeader>
									<CardDescription>
										{release.date}
									</CardDescription>
									<CardTitle className="text-lg">
										{release.title}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-muted-foreground">
										{release.description}
									</p>
									<Button
										variant="link"
										className="px-0 mt-2"
									>
										Read More →
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>

			<div className="max-w-4xl mx-auto">
				<h2 className="text-3xl font-bold mb-8 text-center">
					Creator Program
				</h2>
				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
					<Card>
						<CardHeader>
							<Video className="w-12 h-12 mb-2 text-primary" />
							<CardTitle>Production Support</CardTitle>
							<CardDescription>
								Access professional tools and resources to
								enhance your content
							</CardDescription>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader>
							<Users className="w-12 h-12 mb-2 text-primary" />
							<CardTitle>Creator Community</CardTitle>
							<CardDescription>
								Connect with fellow creators and collaborate on
								projects
							</CardDescription>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader>
							<Download className="w-12 h-12 mb-2 text-primary" />
							<CardTitle>Monetization</CardTitle>
							<CardDescription>
								Multiple revenue streams to help you earn from
								your content
							</CardDescription>
						</CardHeader>
					</Card>
				</div>
				<div className="text-center mt-8">
					<Button size="lg">Join Creator Program</Button>
				</div>
			</div>
		</div>
	);
}
