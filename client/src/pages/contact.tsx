import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { 
  ArrowLeft, Mail, Phone, MapPin, Clock, 
  Send, MessageCircle, HelpCircle, User,
  CheckCircle, AlertCircle
} from "lucide-react";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  type: z.string()
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema)
  });

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      value: "809 486 6678",
      href: "tel:+18094866678",
      description: "Monday to Friday, 9:00 AM - 6:00 PM EST"
    },
    {
      icon: Mail,
      title: "Email",
      value: "metrics@gprojects.com",
      href: "mailto:metrics@gprojects.com",
      description: "We typically respond within 24 hours"
    },
    {
      icon: MapPin,
      title: "Location",
      value: "Dominican Republic",
      href: null,
      description: "Serving traders worldwide"
    }
  ];

  const contactTypes = [
    { value: "general", label: "General Inquiry", icon: MessageCircle },
    { value: "support", label: "Technical Support", icon: HelpCircle },
    { value: "billing", label: "Billing Question", icon: AlertCircle },
    { value: "feedback", label: "Feature Request", icon: User }
  ];

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, you'd send this to your backend
      console.log("Contact form submitted:", data);
      
      setIsSubmitted(true);
      reset();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-gray-900/50 border-gray-800 max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Message Sent!</h2>
            <p className="text-gray-300 mb-6">
              Thank you for contacting us. We'll get back to you within 24 hours.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => setIsSubmitted(false)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Send Another Message
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/'}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-blue-400" />
                <span className="text-xl font-semibold">Contact Us</span>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/help'}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Visit Help Center
              <HelpCircle className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Get in Touch
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Have a question or need support? We're here to help you succeed in your trading journey.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Phone className="h-5 w-5 text-blue-400 mr-2" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                      <info.icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">{info.title}</h3>
                      {info.href ? (
                        <a 
                          href={info.href} 
                          className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-gray-300 font-medium">{info.value}</p>
                      )}
                      <p className="text-gray-400 text-sm mt-1">{info.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Clock className="h-5 w-5 text-green-400 mr-2" />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Monday - Friday</span>
                  <span className="text-white font-medium">9:00 AM - 6:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Saturday</span>
                  <span className="text-white font-medium">10:00 AM - 2:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Sunday</span>
                  <span className="text-gray-400">Closed</span>
                </div>
                <Separator className="my-4 bg-gray-700" />
                <div className="text-sm text-gray-400">
                  <strong className="text-gray-300">Response Time:</strong> We aim to respond to all inquiries within 24 hours during business days.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Send us a Message</CardTitle>
                <p className="text-gray-400">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Contact Type Selection */}
                  <div className="space-y-3">
                    <Label className="text-white">What can we help you with?</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {contactTypes.map((type) => (
                        <div key={type.value}>
                          <input
                            {...register("type")}
                            type="radio"
                            id={type.value}
                            value={type.value}
                            className="sr-only peer"
                          />
                          <label
                            htmlFor={type.value}
                            className="flex items-center space-x-2 p-3 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-750 peer-checked:bg-blue-600/20 peer-checked:border-blue-500 transition-all"
                          >
                            <type.icon className="h-4 w-4 text-gray-400 peer-checked:text-blue-400" />
                            <span className="text-sm text-gray-300">{type.label}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Name and Email */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">Full Name *</Label>
                      <Input
                        {...register("name")}
                        id="name"
                        placeholder="Your full name"
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                      />
                      {errors.name && (
                        <p className="text-red-400 text-sm">{errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email Address *</Label>
                      <Input
                        {...register("email")}
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                      />
                      {errors.email && (
                        <p className="text-red-400 text-sm">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-white">Subject *</Label>
                    <Input
                      {...register("subject")}
                      id="subject"
                      placeholder="Brief description of your inquiry"
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                    />
                    {errors.subject && (
                      <p className="text-red-400 text-sm">{errors.subject.message}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-white">Message *</Label>
                    <Textarea
                      {...register("message")}
                      id="message"
                      placeholder="Please provide as much detail as possible about your question or issue..."
                      rows={6}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 resize-none"
                    />
                    {errors.message && (
                      <p className="text-red-400 text-sm">{errors.message.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending Message...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Send Message
                        <Send className="h-4 w-4 ml-2" />
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Help */}
        <section className="mt-16 bg-gray-900/30 rounded-lg p-8 border border-gray-800">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-white">Looking for immediate answers?</h3>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Check out our comprehensive help center and documentation before reaching out. You might find your answer instantly!
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <Button 
                onClick={() => window.location.href = '/help'}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Browse Help Center
                <HelpCircle className="h-4 w-4 ml-2" />
              </Button>
              <Button 
                onClick={() => window.location.href = '/docs'}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                View Documentation
                <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}