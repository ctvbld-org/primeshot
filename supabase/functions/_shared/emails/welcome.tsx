import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Hr,
  Img,
  Link,
  Tailwind,
  Row,
  Column,
} from '@react-email/components';

const WelcomeEmail = () => {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>Transform your selfies into professional headshots with AI - Welcome to Primeshot!</Preview>
        <Body className="bg-white font-sans p-0">
          {/* Accent color bar at the very top */}
          <Section className="bg-[#2ADED8] h-[12px] w-full m-auto max-w-[600px]"></Section>
          <Container className="bg-black mx-auto px-0 max-w-[600px] w-full">
            
            <Section className="px-[20px] sm:px-[40px]">
              <Img
                src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/base-primeshot-logo.png"
                alt="Primeshot"
                className="w-[74px] h-[74px] object-cover my-[40px]"
              />
              
              <Heading className="text-[#99EFEC] leading-[34px] text-[28px] sm:text-[34px] font-semibold mb-[32px] mt-0">
                Welcome to the<br/>Primeshot Beta
              </Heading>
               
              <Text className="text-white text-[16px] sm:text-[18px] leading-[22px] sm:leading-[24px] mb-[40px]">
                You're now part of a small group shaping the future of professional headshots. Here's what you need to know to get started:
              </Text>
              
              {/* Three-Step Process */}
              <Section className="mb-[40px]">
                {/* Step 1 */}
                <Row className="mb-[24px]">
                  <Column className="w-[60px] align-top">
                    <div className="w-[48px] h-[48px] bg-[#041616] rounded-full" style={{display: 'table-cell', textAlign: 'center', verticalAlign: 'middle'}}>
                      <Text className="text-[#2ADED8] text-[16px] font-bold m-0">1</Text>
                    </div>
                  </Column>
                  <Column className="pl-[16px] pr-[16px] align-top">
                    <Heading className="text-white text-[18px] font-medium mb-[8px] mt-0">
                      Customise your shoot
                    </Heading>
                    <Text className="text-white/60 text-[14px] font-regular leading-[18px] m-0">
                      Choose a photo style, set the scene and pick your outfit
                    </Text>
                  </Column>
                  <Column className="min-w-[60px] text-right align-top">
                    <table cellPadding="0" cellSpacing="0" style={{width: '100%'}}>
                      <tr>
                        <td style={{textAlign: 'right', paddingBottom: '4px'}}>
                          <Img
                            src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/welcome-01.png"
                            alt="Photo Styles"
                            className="w-[48px] h-[48px] object-cover"
                          />
                        </td>
                      
                        <td style={{textAlign: 'right', paddingBottom: '4px'}}>
                          <Img
                            src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/welcome-02.png"
                            alt="Scenes"
                            className="w-[48px] h-[48px] object-cover"
                          />
                        </td>
                      
                        <td style={{textAlign: 'right'}}>
                          <Img
                            src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/welcome-03.png"
                            alt="Wardrobe"
                            className="w-[48px] h-[48px] object-cover"
                          />
                        </td>
                      </tr>
                    </table>
                  </Column>
                </Row>
                
                <Hr className="my-[20px]" style={{ borderColor: '#111111', borderStyle: 'solid', borderWidth: '1px' }} />
                
                {/* Step 2 */}
                <Row className="mb-[24px]">
                  <Column className="w-[60px] align-top">
                    <div className="w-[48px] h-[48px] bg-[#041616] rounded-full" style={{display: 'table-cell', textAlign: 'center', verticalAlign: 'middle'}}>
                      <Text className="text-[#2ADED8] text-[16px] font-bold m-0">2</Text>
                    </div>
                  </Column>
                  <Column className="pl-[16px] pr-[16px] align-top">
                    <Heading className="text-white text-[18px] font-medium mb-[8px] mt-0">
                      Meet your Character
                    </Heading>
                    <Text className="text-white/60 text-[14px] font-regular leading-[18px] m-0">
                      Upload your best selfies with varied expressions, angles, and poses to shape your unique AI twin!
                    </Text>
                  </Column>
                  <Column className="w-[48px] text-right align-top">
                    <Img
                      src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/welcome-04.png"
                      alt="Character"
                      className="w-[48px] h-[48px] object-cover"
                    />
                  </Column>
                </Row>
                
                <Hr className="my-[20px]" style={{ borderColor: '#111111', borderStyle: 'solid', borderWidth: '1px' }} />
                
                {/* Step 3 */}
                <Row className="mb-[24px]">
                  <Column className="w-[60px] align-top">
                    <div className="w-[48px] h-[48px] bg-[#041616] rounded-full" style={{display: 'table-cell', textAlign: 'center', verticalAlign: 'middle'}}>
                      <Text className="text-[#2ADED8] text-[16px] font-bold m-0">3</Text>
                    </div>
                  </Column>
                  <Column className="pl-[16px] pr-[16px] align-top">
                    <Heading className="text-white text-[18px] font-medium mb-[8px] mt-0">
                      Generate
                    </Heading>
                    <Text className="text-white/60 text-[14px] font-regular leading-[18px] m-0">
                      Get your portraits in minutes – authentic, polished, and ready to use.
                    </Text>
                  </Column>
                  <Column className="w-[48px] text-right align-top">
                    <Img
                      src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/welcome-05.png"
                      alt="Generate"
                      className="w-[48px] h-[48px] object-cover"
                    />
                  </Column>
                </Row>
              </Section>
              
            </Section>
            
            <Section className="px-[20px]">
              <Img
                src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/welcome-06.png"
                alt="Founding 300"
                className="w-full h-auto object-cover mb-[20px]"
              />
              
              <Button
                href="https://primeshot.ai/create"
                className="bg-[#FF550E] w-full text-white px-[32px] py-[16px] rounded-[16px] text-[16px] font-semibold no-underline box-border text-center"
              >
                Create your shoot
              </Button>
            </Section>

            <Section className="px-[40px] pt-[80px]">
              <Heading className="text-[#99EFEC] leading-[34px] text-[28px] sm:text-[34px] font-semibold mb-[32px] mt-0">
                Tell us what you think
              </Heading>
              <Text className="text-white text-[16px] sm:text-[18px] leading-[22px] sm:leading-[24px] mb-[24px]">
                As one of our earliest users, your feedback will directly guide what we build next. If something feels off, or you've got some ideas, we want to hear it. 
              </Text>
              <Text className="text-white text-[16px] sm:text-[18px] leading-[22px] sm:leading-[24px] mb-[24px]">
                Just drop us a note at <Link href="mailto:team@primeshot.ai" className="text-[#2ADED8] underline">team@primeshot.ai</Link> or reply to this email, every message helps shape the future of the product.
              </Text>
            </Section>
            <Section>
              <Img
                  src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/beta-invite-03.png"
                  alt="Preview Shots"
                  className="w-full h-auto object-cover mt-[40px]"
              />
              
              <Text className="text-[#99EFEC] text-[28px] sm:text-[34px] font-semibold text-center leading-[32px] sm:leading-[34px] my-[60px] sm:my-[80px]">
                Thank You
              </Text>
              <Img
                src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/base-primeshot-footer-logo.png"
                alt="Primeshot"
                className="w-[140px] h-auto mx-auto object-cover mb-[40px]"
              />
              <Text className="text-white text-[13px] leading-[16px] text-center mb-4 px-[20px]">
                Primeshot, a Creativebuild product.
              </Text>
              <Text className="text-white/60 text-[13px] leading-[16px] text-center mb-8 px-[20px]">
                You are receiving this email because you opted in via our website.
              </Text>
              
              {/* Social Media Icons */}
              <Section className="text-center mb-[24px]">
                <Link href="https://x.com/primeshotai" className="inline-block mx-[8px]">
                  <Img
                    src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/base-icon-x.png"
                    alt="X"
                    className="w-[24px] h-[24px] object-cover"
                  />
                </Link>
                <Link href="https://instagram.com/primeshotai" className="inline-block mx-[8px]">
                  <Img
                    src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/base-icon-ig.png"
                    alt="Instagram"
                    className="w-[24px] h-[24px] object-cover"
                  />
                </Link>
                <Link href="https://linkedin.com/company/primeshotai" className="inline-block mx-[8px]">
                  <Img
                    src="https://d3el9qajjnmn76.cloudfront.net/website-images/email/base-icon-ln.png"
                    alt="LinkedIn"
                    className="w-[24px] h-[24px] object-cover"
                  />
                </Link>
              </Section>
              
              {/* Copyright */}
              <Text className="text-[#888888] text-[12px] leading-[16px] text-center m-0 pb-[40px] px-[20px]">
                © 2024 Primeshot
              </Text>
              
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;