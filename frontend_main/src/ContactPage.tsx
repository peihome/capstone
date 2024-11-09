import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Phone } from "lucide-react";

export default function Contact() {
	return (
		<div className="container mx-auto px-4 py-12">
			<div className="max-w-3xl mx-auto text-center mb-16">
				<h1 className="text-4xl font-bold mb-6">Contact Us</h1>
				<p className="text-xl text-muted-foreground">
					We're here to help and answer any questions you might have
				</p>
			</div>

			<div className="grid md:grid-cols-3 gap-6 mb-12">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Mail className="w-5 h-5" />
							Email Us
						</CardTitle>
						<CardDescription>
							Send us an email for general inquiries
						</CardDescription>
					</CardHeader>
					<CardContent>
						<a
							href="mailto:support@Nexstream.com"
							className="text-primary hover:underline"
						>
							support@Nexstream.com
						</a>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Phone className="w-5 h-5" />
							Call Us
						</CardTitle>
						<CardDescription>
							Mon-Fri from 8am to 5pm
						</CardDescription>
					</CardHeader>
					<CardContent>
						<a
							href="tel:+1-555-123-4567"
							className="text-primary hover:underline"
						>
							+1 (555) 123-4567
						</a>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<MessageSquare className="w-5 h-5" />
							Live Chat
						</CardTitle>
						<CardDescription>Available 24/7</CardDescription>
					</CardHeader>
					<CardContent>
						<Button variant="outline" className="w-full">
							Start Chat
						</Button>
					</CardContent>
				</Card>
			</div>

			<Card className="max-w-2xl mx-auto">
				<CardHeader>
					<CardTitle>Send us a message</CardTitle>
					<CardDescription>
						Fill out the form below and we'll get back to you as
						soon as possible
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="space-y-6">
						<div className="grid md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="firstName">First name</Label>
								<Input
									id="firstName"
									placeholder="Enter your first name"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="lastName">Last name</Label>
								<Input
									id="lastName"
									placeholder="Enter your last name"
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="Enter your email"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="subject">Subject</Label>
							<Input id="subject" placeholder="Enter subject" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="message">Message</Label>
							<Textarea
								id="message"
								placeholder="Enter your message"
								className="min-h-[150px]"
							/>
						</div>
						<Button type="submit" className="w-full">
							Send Message
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
