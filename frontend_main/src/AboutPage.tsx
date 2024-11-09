import { Card, CardContent } from "@/components/ui/card";
import { Play, Users, Globe, Award } from "lucide-react";

export default function About() {
	return (
		<div className="container mx-auto px-4 py-12">
			<div className="max-w-3xl mx-auto text-center mb-16">
				<h1 className="text-4xl font-bold mb-6">About Nexstream</h1>
				<p className="text-xl text-muted-foreground">
					Empowering creators and connecting viewers through the power
					of video
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-12 mb-20">
				<div>
					<h2 className="text-3xl font-bold mb-6">Our Story</h2>
					<p className="text-muted-foreground leading-relaxed">
						Founded in 2024, Nexstream has grown from a small
						startup to a global community of creators and viewers.
						Our platform provides a space for millions of people to
						share their stories, knowledge, and creativity through
						video content.
					</p>
				</div>
				<div className="aspect-video rounded-lg overflow-hidden">
					<img
						src="https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&q=80"
						alt="Team collaboration"
						className="w-full h-full object-cover"
					/>
				</div>
			</div>

			<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
				<Card>
					<CardContent className="pt-6">
						<Play className="w-12 h-12 mb-4 text-primary" />
						<h3 className="text-xl font-bold mb-2">1B+</h3>
						<p className="text-muted-foreground">
							Videos watched daily
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<Users className="w-12 h-12 mb-4 text-primary" />
						<h3 className="text-xl font-bold mb-2">500M+</h3>
						<p className="text-muted-foreground">Active users</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<Globe className="w-12 h-12 mb-4 text-primary" />
						<h3 className="text-xl font-bold mb-2">190+</h3>
						<p className="text-muted-foreground">
							Countries reached
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<Award className="w-12 h-12 mb-4 text-primary" />
						<h3 className="text-xl font-bold mb-2">50+</h3>
						<p className="text-muted-foreground">Industry awards</p>
					</CardContent>
				</Card>
			</div>

			<div className="max-w-3xl mx-auto">
				<h2 className="text-3xl font-bold mb-6 text-center">
					Our Mission
				</h2>
				<p className="text-muted-foreground text-center leading-relaxed mb-12">
					To create a platform where anyone can share their voice,
					find their audience, and build a community around their
					passions. We believe in the power of video to educate,
					entertain, and bring people together.
				</p>
			</div>
		</div>
	);
}
