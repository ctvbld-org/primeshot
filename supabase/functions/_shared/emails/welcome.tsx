import * as React from "react";
import {
  Html,
  Tailwind,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Img,
  Hr,
} from "@react-email/components";

export type WelcomeEmailProps = {
  name?: string;
  userId?: string;
};

export default function WelcomeEmail({ name, userId }: WelcomeEmailProps) {
  const displayName = name && name.trim() ? name : "there";
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>
          Transform your selfies into professional headshots with AI - Welcome to Primeshot!
        </Preview>
        <Body className="bg-white font-sans p-0">
          <Section className="bg-[#2ADED8] h-[12px] w-full m-auto max-w-[600px]" />
          <Container className="bg-black mx-auto px-0 max-w-[600px] w-full">
            <Section className="px-[20px] sm:px-[40px]">
              <Img
                src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/base-primeshot-logo.png"
                alt="Primeshot"
                className="w-[74px] h-[74px] object-cover my-[40px]"
              />

              <Heading className="text-[#99EFEC] leading-[34px] text-[28px] sm:text-[34px] font-semibold mb-[32px] mt-0">
                Welcome to the
                <br />
                Primeshot Beta
              </Heading>

              <Text className="text-white text-[16px] sm:text-[18px] leading-[22px] sm:leading-[24px] mb-[16px]">
                Hi {displayName}, you’re now part of a small group shaping the future of professional headshots.
              </Text>

              {/* Add more rich content here as needed */}

              <Hr className="border-[#222] my-[32px]" />
              <Text className="text-[#aaa] text-[12px] leading-[18px]">
                {userId ? `User ID: ${userId}` : ""} — The Primeshot Team
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}


