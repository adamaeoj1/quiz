/* eslint-disable @next/next/no-img-element */
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import aboutMd from "@/docs/about.md";
import { Github, Linkedin } from "lucide-react";
import Link from "next/link";
import React from "react";

const About = () => {
  const devs = [
    {
      name: "Omar Emad Ghazlan",
      linkedIn: "https://www.linkedin.com/in/omar-emad-ghazlan",
      image: "/images/omar.jpg",
      github: "https://github.com/omar-emad",
    },
    {
      name: "Adam Lamkirta",
      linkedIn: "https://www.linkedin.com/in/adam-lamkirta", 
      image: "/images/adam.jpg",
      github: "https://github.com/adam-lamkirta",
    },
    {
      name: "Ammar Ahmed Hassaan",
      linkedIn: "https://www.linkedin.com/in/ammar-ahmed-hassaan",
      image: "/images/ammar.jpg", 
      github: "https://github.com/ammar-hassaan",
    },
    {
      name: "Mohamed Fathy",
      linkedIn: "https://www.linkedin.com/in/mhamed-fathy",
      image: "/images/mohaed.jpg",
      github: "https://github.com/mhamed-fathy",
    },
  ];

  const shuffledDevs = devs.sort(() => Math.random() - 0.5);

  return (
    <div className="w-full flex flex-col items-center gap-5 p-4">
      <Link href={"/"} className="flex items-center gap-1 mr-auto z-40">
        <img src="/images/Logo.png" alt="" className="w-[55px] h-auto object-contain" />
        <span className="font-bold">Quiz Sensei</span>
      </Link>
      <div className="w-full flex flex-col items-center gap-5 max-w-[1000px]">
        <div className="w-full">
          <MarkdownRenderer markdown={"## Meet the Team"} />
        </div>
        <div className="flex flex-wrap w-full gap-5 justify-center my-5">
          {shuffledDevs.map((dev, index) => {
            return (
              <Card
                key={index}
                className="w-full max-w-[350px] p-4 flex flex-col gap-2 hover:shadow-lg transition-shadow duration-300"
              >
                <Avatar className="rounded-lg overflow-hidden w-full h-auto aspect-square">
                  <AvatarImage
                    src={dev.image}
                    alt={dev.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </Avatar>
                <h4 className="font-semibold text-lg">{dev.name}</h4>
                <div className="flex items-center gap-2">
                  <a
                    href={dev.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Badge className="flex items-center gap-1 w-fit text-white hover:opacity-90 transition-opacity">
                      <Linkedin size={14} />
                      <span>LinkedIn</span>
                    </Badge>
                  </a>
                  <a
                    href={dev.github}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Badge className="flex items-center gap-1 w-fit bg-neutral-800 text-white hover:bg-neutral-900 transition-colors">
                      <Github size={14} />
                      <span>GitHub</span>
                    </Badge>
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
        <div className="mt-10">
          <MarkdownRenderer markdown={aboutMd} />
        </div>
      </div>
    </div>
  );
};

export default About;
