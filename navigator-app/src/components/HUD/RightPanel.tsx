"use client";

import { useAppStore } from "@/store/useAppStore";
import { Eye, Building2, Globe, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from 'react';

interface CommercialProfile {
  companyName: string;
  industry: string;
  description: string;
  contact: string;
  website: string;
  socialHandle: string;
  brandColor: string;
  imageUrl: string;
}

export interface PropertyProfile {
  title: string;
  price: string;
  beds: number;
  baths: number;
  sqft: string;
  description: string;
  agentName: string;
  imageUrl: string;
}

export interface CityProfile {
  name: string;
  pop: string;
  gdp: string;
  edu: string;
  facts: string[];
  commercial: CommercialProfile;
  property: PropertyProfile;
}

export const CITY_INTEL: Record<string, CityProfile> = {
  // AFRICA
  JOBURG: { name: "JOHANNESBURG", pop: "6.1 Million", gdp: "16% of National", edu: "85.4% Index", facts: ["Largest man-made urban forest in the world.", "Produces 16% of South Africa's total GDP.", "Home to the deepest mines on the planet.", "The city was rebuilt four times in a single century."], commercial: { companyName: "DISCOVERY LIMITED", industry: "HEALTH TECH", description: "Pioneering shared-value insurance and global health behavioral tracking.", contact: "+27 11 529 2888", website: "https://www.discovery.co.za", socialHandle: "@Discovery_SA", brandColor: "#000080", imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80" }, property: { title: "THE HOUGHTON PENTHOUSE", price: "$4,200,000", beds: 4, baths: 5, sqft: "6,500", description: "Ultra-luxury penthouse overlooking the world's largest urban forest.", agentName: "Marcus Vance", imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80" } },
  CAPETOWN: { name: "CAPE TOWN", pop: "4.8 Million", gdp: "9.9% of National", edu: "81.5% Index", facts: ["First city in Africa to be named a UNESCO City of Design.", "Table Mountain boasts more plant species than the entire UK.", "Home to one of the world's most successful desalination grids.", "The legislative capital of South Africa."], commercial: { companyName: "NASPERS", industry: "VENTURE CAPITAL", description: "Global consumer internet group and one of the largest technology investors in the world.", contact: "+27 21 406 2121", website: "https://www.naspers.com", socialHandle: "@Naspers", brandColor: "#00A1FF", imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80" }, property: { title: "CLIFTON HYPER-VILLA", price: "$14,500,000", beds: 6, baths: 7, sqft: "12,000", description: "Seamless oceanic horizon integration with multi-deck infinity pools.", agentName: "Elena Rostova", imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" } },
  PRETORIA: { name: "PRETORIA", pop: "2.7 Million", gdp: "8.5% of National", edu: "83.8% Index", facts: ["Produces over 80% of SA's automotive exports.", "Hosts the second-largest number of embassies in the world.", "Famous for its 70,000 Jacaranda trees.", "The executive capital and administrative hub."], commercial: { companyName: "FORD MOTOR CO. SA", industry: "AUTOMOTIVE R&D", description: "Leading advanced automotive manufacturing and international vehicle exportation.", contact: "+27 12 842 2911", website: "https://www.ford.co.za", socialHandle: "@FordSouthAfrica", brandColor: "#003478", imageUrl: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80" }, property: { title: "WATERKLOOF ESTATE", price: "$2,800,000", beds: 5, baths: 6, sqft: "8,500", description: "Diplomatic-grade secure luxury compound in the capital's heart.", agentName: "Johan De Beer", imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80" } },
  DURBAN: { name: "DURBAN", pop: "3.9 Million", gdp: "8.0% of National", edu: "86.3% Index", facts: ["Busiest container port in Sub-Saharan Africa.", "Home to the largest population of Indians outside of India.", "Hosts the Moses Mabhida Stadium.", "The surfing capital of the African continent."], commercial: { companyName: "MR PRICE GROUP", industry: "OMNI-CHANNEL RETAIL", description: "A high-volume, global apparel and home-ware value retailer.", contact: "+27 800 212 535", website: "https://www.mrpricegroup.com", socialHandle: "@MrPriceGroup", brandColor: "#E31837", imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80" }, property: { title: "UMHLANGA PEARL", price: "$3,600,000", beds: 3, baths: 4, sqft: "4,200", description: "Bespoke beachfront sky-mansion with private biometric elevator access.", agentName: "Priya Naidoo", imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80" } },
  // EUROPE
  LONDON: { name: "LONDON", pop: "9.0 Million", gdp: "22% of UK", edu: "99.0% Index", facts: ["Over 300 languages are spoken in London.", "The London Underground is the oldest rapid transit system.", "Has more billionaires than Paris and Geneva combined.", "Big Ben is actually the name of the bell, not the tower."], commercial: { companyName: "HSBC HOLDINGS", industry: "GLOBAL FINANCE", description: "One of the largest banking and financial services organizations in the world.", contact: "+44 20 7991 8888", website: "https://www.hsbc.com", socialHandle: "@HSBC", brandColor: "#DB0011", imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80" }, property: { title: "MAYFAIR TOWNHOUSE", price: "$28,000,000", beds: 7, baths: 8, sqft: "9,000", description: "Heritage listed exterior boasting a subterranean cybernetic leisure complex.", agentName: "Lord H. Kensington", imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80" } },
  BERLIN: { name: "BERLIN", pop: "3.8 Million", gdp: "4.1% of Germany", edu: "96.5% Index", facts: ["Has more bridges than Venice.", "Nine times the size of Paris.", "Home to the largest train station in Europe.", "Famous for its vibrant underground street art scene."], commercial: { companyName: "VOLKSWAGEN CARIAD", industry: "AUTOMOTIVE SOFTWARE", description: "Pioneering the unified software platform for all Volkswagen Group autonomous vehicles.", contact: "+49 5361 90", website: "https://cariad.technology", socialHandle: "@CARIAD_Tech", brandColor: "#001E50", imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80" }, property: { title: "MITTE KREUZBERG LOFT", price: "$6,500,000", beds: 2, baths: 3, sqft: "3,800", description: "Converted brutalist architecture featuring smart-glass panoramic walls.", agentName: "Lukas Weber", imageUrl: "https://images.unsplash.com/photo-1600607688969-a5bfcd64bd40?auto=format&fit=crop&w=800&q=80" } },
  PARIS: { name: "PARIS", pop: "2.1 Million", gdp: "31% of France", edu: "99.0% Index", facts: ["The Eiffel Tower was originally intended to be temporary.", "There are only 20 stop signs in the entire city.", "The Louvre is the most visited art museum in the world.", "The city is divided into 20 arrondissements."], commercial: { companyName: "LVMH MOËT HENNESSY", industry: "LUXURY GOODS", description: "The world's leading luxury products group, holding 75 distinguished Maisons.", contact: "+33 1 44 13 22 22", website: "https://www.lvmh.com", socialHandle: "@LVMH", brandColor: "#F5F5DC", imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80" }, property: { title: "AVENUE MONTAIGNE MAISON", price: "$34,000,000", beds: 5, baths: 5, sqft: "7,500", description: "Direct Eiffel Tower views locked behind military-grade security systems.", agentName: "Camille Dubois", imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" } },
  ROME: { name: "ROME", pop: "2.8 Million", gdp: "9% of Italy", edu: "95.0% Index", facts: ["Rome has a sovereign state (Vatican City) entirely within its limits.", "Romans built an aqueduct network over 400 miles long.", "The Colosseum could seat 50,000 spectators.", "Rome has over 900 churches."], commercial: { companyName: "ENEL SPA", industry: "RENEWABLE ENERGY", description: "Multinational manufacturer and distributor of electricity and gas.", contact: "+39 06 8305 1", website: "https://www.enel.com", socialHandle: "@EnelGroup", brandColor: "#E32B66", imageUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80" }, property: { title: "VILLA BORGHESE ESTATE", price: "$18,500,000", beds: 8, baths: 10, sqft: "14,000", description: "Renaissance aesthetics paired with next-generation neuro-home automation.", agentName: "Marco Rossi", imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80" } },
  // NORTH AMERICA
  NY: { name: "NEW YORK", pop: "8.3 Million", gdp: "$2.0 Trillion", edu: "95.0% Index", facts: ["More than 800 languages are spoken in NYC.", "The Federal Reserve Bank holds $90 billion in gold.", "Central Park is larger than the principality of Monaco.", "The Statue of Liberty was a gift from France in 1886."], commercial: { companyName: "JPMORGAN CHASE & CO.", industry: "INVESTMENT BANKING", description: "Leading global financial services firm and one of the largest banking institutions.", contact: "+1 212 270 6000", website: "https://www.jpmorganchase.com", socialHandle: "@JPMorgan", brandColor: "#117ACA", imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80" }, property: { title: "BILLIONAIRES ROW PENTHOUSE", price: "$85,000,000", beds: 4, baths: 6, sqft: "8,000", description: "Suspended 1,200ft above Central Park. The pinnacle of global wealth.", agentName: "Victoria Chase", imageUrl: "https://images.unsplash.com/photo-1628611225249-6c4ff5aa35b6?auto=format&fit=crop&w=800&q=80" } },
  LA: { name: "LOS ANGELES", pop: "3.8 Million", gdp: "$1.1 Trillion", edu: "93.0% Index", facts: ["The Hollywood sign originally read 'Hollywoodland'.", "LA is the entertainment capital of the world.", "It has a larger economy than Saudi Arabia.", "LA features exactly 11 distinct microclimates."], commercial: { companyName: "THE WALT DISNEY CO.", industry: "ENTERTAINMENT", description: "A diversified multinational mass media and entertainment conglomerate.", contact: "+1 818 560 1000", website: "https://thewaltdisneycompany.com", socialHandle: "@WaltDisneyCo", brandColor: "#00126B", imageUrl: "https://images.unsplash.com/photo-1585647347384-2593bc35786b?auto=format&fit=crop&w=800&q=80" }, property: { title: "BEL AIR MEGAMANSION", price: "$120,000,000", beds: 12, baths: 18, sqft: "38,000", description: "Includes a private nightclub, indoor waterfall, and 20-car showcase garage.", agentName: "Caleb Sterling", imageUrl: "https://images.unsplash.com/photo-1613490908592-fd0a5a3bdcb8?auto=format&fit=crop&w=800&q=80" } },
  TORONTO: { name: "TORONTO", pop: "2.9 Million", gdp: "20% of Canada", edu: "98.5% Index", facts: ["Over half of Toronto's residents were born outside Canada.", "The CN Tower was the world's tallest freestanding structure for 32 years.", "The Toronto Zoo is the largest in Canada.", "Home to the longest street in the world, Yonge Street."], commercial: { companyName: "SHOPIFY INC.", industry: "E-COMMERCE TECH", description: "Leading global commerce company providing trusted tools to start, grow, and manage a retail business.", contact: "+1 888 746 7439", website: "https://www.shopify.com", socialHandle: "@Shopify", brandColor: "#96BF48", imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80" }, property: { title: "BRIDLE PATH CHATEAU", price: "$22,000,000", beds: 9, baths: 12, sqft: "18,500", description: "Heated driveways and a climate-controlled indoor botanical garden.", agentName: "Sarah Jenkins", imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80" } },
  MEXICO: { name: "MEXICO CITY", pop: "9.2 Million", gdp: "15% of Mexico", edu: "89.0% Index", facts: ["Built on a lake, the city sinks about 10 inches a year.", "It has the largest number of museums in the Americas.", "The subway system is the lowest-priced in the world.", "Chapultepec Park is double the size of Central Park."], commercial: { companyName: "AMÉRICA MÓVIL", industry: "TELECOMMUNICATIONS", description: "The undisputed leading provider of integrated telecommunications services in Latin America.", contact: "+52 55 2581 4449", website: "https://www.americamovil.com", socialHandle: "@AmericaMovil", brandColor: "#003A70", imageUrl: "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?auto=format&fit=crop&w=800&q=80" }, property: { title: "POLANCO SKY-VILLA", price: "$9,800,000", beds: 4, baths: 5, sqft: "6,200", description: "Cantilevered infinity pool overlooking the entire Chapultepec Park.", agentName: "Javier Martinez", imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80" } },
  // SOUTH AMERICA
  SAO: { name: "SAO PAULO", pop: "12.3 Million", gdp: "10% of Brazil", edu: "90.0% Index", facts: ["Has the largest fleet of helicopters in the world.", "The largest Japanese population outside Japan resides here.", "Generates more wealth than the entire nation of Argentina.", "Famous for its massive, 24/7 pizza culture."], commercial: { companyName: "PETROBRAS", industry: "MULTINATIONAL ENERGY", description: "State-owned Brazilian multinational corporation in the petroleum industry.", contact: "+55 800 728 9001", website: "https://petrobras.com.br", socialHandle: "@petrobras", brandColor: "#008A52", imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80" }, property: { title: "JARDINS COMPOUND", price: "$15,500,000", beds: 7, baths: 9, sqft: "11,000", description: "Features a private helipad and subterranean 3-level bunker.", agentName: "Beatriz Silva", imageUrl: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80" } },
  BA: { name: "BUENOS AIRES", pop: "3.1 Million", gdp: "24% of Argentina", edu: "93.0% Index", facts: ["Has the highest concentration of psychiatrists globally.", "Avenida 9 de Julio is the widest avenue in the world.", "Known as the 'Paris of South America'.", "The birthplace of the Tango."], commercial: { companyName: "MERCADO LIBRE", industry: "E-COMMERCE & FINTECH", description: "The largest online commerce and payments ecosystem in Latin America.", contact: "+54 11 4640 8000", website: "https://www.mercadolibre.com", socialHandle: "@MercadoLibre", brandColor: "#FFE600", imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80" }, property: { title: "PUERTO MADERO DUPLEX", price: "$7,200,000", beds: 3, baths: 4, sqft: "4,800", description: "River-front panoramic floor-to-ceiling smart-glass architecture.", agentName: "Mateo Gonzalez", imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80" } },
  BOGOTA: { name: "BOGOTA", pop: "7.1 Million", gdp: "25% of Colombia", edu: "91.0% Index", facts: ["One of the highest altitude capitals in the world.", "Features over 300 kilometers of dedicated cycling paths.", "Hosts the world's largest theater festival.", "Home to the iconic Gold Museum."], commercial: { companyName: "ECOPETROL", industry: "OIL & GAS", description: "The largest and primary petroleum company in Colombia.", contact: "+57 601 234 4000", website: "https://www.ecopetrol.com.co", socialHandle: "@ECOPETROL_SA", brandColor: "#006B33", imageUrl: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=800&q=80" }, property: { title: "ROSALES MANSION", price: "$5,900,000", beds: 5, baths: 6, sqft: "7,200", description: "Nestled in the eastern mountains with an integrated oxygen-enrichment HVAC.", agentName: "Luciana Mendez", imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" } },
  LIMA: { name: "LIMA", pop: "9.7 Million", gdp: "45% of Peru", edu: "88.0% Index", facts: ["The second driest capital city in the world after Cairo.", "Home to the oldest university in the Americas (1551).", "Lima is globally recognized as the culinary capital of Latin America.", "Contains hundreds of pre-Inca pyramids."], commercial: { companyName: "CREDICORP", industry: "FINANCIAL SERVICES", description: "The largest financial holding company in Peru, leading in banking, insurance, and pensions.", contact: "+51 1 313 2000", website: "https://www.credicorpnet.com", socialHandle: "@CredicorpBank", brandColor: "#003A70", imageUrl: "https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&w=800&q=80" }, property: { title: "SAN ISIDRO PALACE", price: "$4,500,000", beds: 6, baths: 7, sqft: "8,200", description: "Colonial shell housing an entirely digitized neural-link ready luxury space.", agentName: "Diego Vargas", imageUrl: "https://images.unsplash.com/photo-1600607688969-a5bfcd64bd40?auto=format&fit=crop&w=800&q=80" } },
  // ASIA
  TOKYO: { name: "TOKYO", pop: "14.0 Million", gdp: "$2.0 Trillion", edu: "99.9% Index", facts: ["The busiest pedestrian intersection in the world (Shibuya).", "Has over 200 Michelin-starred restaurants.", "The Tsukiji market was the largest fish market globally.", "Tokyo boasts the most extensive urban rail network."], commercial: { companyName: "SONY GROUP CORP", industry: "CONSUMER ELECTRONICS", description: "A multinational conglomerate leading the world's entertainment and technology sectors.", contact: "+81 3 6748 2111", website: "https://www.sony.com", socialHandle: "@Sony", brandColor: "#000000", imageUrl: "https://images.unsplash.com/photo-1505156868547-9b5efaadfdfc?auto=format&fit=crop&w=800&q=80" }, property: { title: "MINATO-KU SANCTUARY", price: "$42,000,000", beds: 5, baths: 6, sqft: "5,500", description: "Ultra-minimalist design featuring a holographic Zen garden.", agentName: "Kenji Tanaka", imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80" } },
  SHANGHAI: { name: "SHANGHAI", pop: "24.8 Million", gdp: "3.8% of China", edu: "98.0% Index", facts: ["Shanghai has the longest metro system in the world.", "Home to the second-tallest building globally (Shanghai Tower).", "The city's name literally translates to 'Upon the Sea'.", "Features an ultra-fast magnetic levitation (Maglev) train."], commercial: { companyName: "TENCENT HOLDINGS", industry: "INTERNET & AI", description: "World-leading internet and technology company powering the largest digital ecosystems in Asia.", contact: "+86 755 8601 3388", website: "https://www.tencent.com", socialHandle: "@TencentGlobal", brandColor: "#0052D9", imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80" }, property: { title: "PUDONG SKY-PALACE", price: "$38,000,000", beds: 6, baths: 8, sqft: "9,500", description: "Located on the 95th floor with a private magnetic levitation pod bay.", agentName: "Wei Chen", imageUrl: "https://images.unsplash.com/photo-1628611225249-6c4ff5aa35b6?auto=format&fit=crop&w=800&q=80" } },
  MUMBAI: { name: "MUMBAI", pop: "12.4 Million", gdp: "6% of India", edu: "89.0% Index", facts: ["Home to the prolific Bollywood film industry.", "The city was originally an archipelago of seven islands.", "Features the most expensive private residence in the world.", "The dabbawala lunch delivery system has a Six Sigma rating."], commercial: { companyName: "RELIANCE INDUSTRIES", industry: "MULTINATIONAL CONGLOMERATE", description: "India's largest private sector company, operating energy, petrochemicals, telecommunications, and retail.", contact: "+91 22 3555 5000", website: "https://www.ril.com", socialHandle: "@RelianceIndustriesLimited", brandColor: "#0000CD", imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80" }, property: { title: "MALABAR HILL ESTATE", price: "$65,000,000", beds: 10, baths: 12, sqft: "22,000", description: "Arabian sea panoramas, fully staffed, and self-sufficient energy grid.", agentName: "Aarav Patel", imageUrl: "https://images.unsplash.com/photo-1613490908592-fd0a5a3bdcb8?auto=format&fit=crop&w=800&q=80" } },
  SG: { name: "SINGAPORE", pop: "5.6 Million", gdp: "$400 Billion", edu: "99.5% Index", facts: ["Singapore consists of one main island and 63 snaller ones.", "The city-state is a pioneer in highly purified reclaimed water.", "It's one of only three surviving true city-states in the world.", "Home to the world's first night zoo."], commercial: { companyName: "DBS BANK LTD", industry: "BANKING & FINANCE", description: "A leading financial services group in Asia seamlessly connecting markets across Greater China, SE Asia, and South Asia.", contact: "+65 1800 111 1111", website: "https://www.dbs.com", socialHandle: "@dbsbank", brandColor: "#E01A22", imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80" }, property: { title: "MARINA BAY TRANQUILITY", price: "$26,000,000", beds: 4, baths: 5, sqft: "4,600", description: "Direct views of the Supertrees with a private indoor arboretum.", agentName: "Chloe Lim", imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80" } },
  // OCEANIA
  SYDNEY: { name: "SYDNEY", pop: "5.3 Million", gdp: "25% of Australia", edu: "99.0% Index", facts: ["The Sydney Harbour Bridge is the widest long-span bridge globally.", "Has over 100 stunning, distinct beaches.", "The Sydney Opera House roof consists of 1 million tiles.", "Sydney is the oldest city in Australia."], commercial: { companyName: "MACQUARIE GROUP", industry: "INVESTMENT & ASSET MANAGEMENT", description: "A global financial group providing clients with asset management and finance, banking, advisory, and risk/capital solutions.", contact: "+61 2 8232 3333", website: "https://www.macquarie.com", socialHandle: "@Macquarie", brandColor: "#171A21", imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80" }, property: { title: "POINT PIPER WATERFRONT", price: "$48,000,000", beds: 6, baths: 7, sqft: "11,500", description: "Deep water mooring for superyachts and a glass-bottom cantilevered pool.", agentName: "Harrison Ford", imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" } },
  MELB: { name: "MELBOURNE", pop: "5.1 Million", gdp: "20% of Australia", edu: "99.0% Index", facts: ["Features the largest tram network in the world.", "Often ranked as the absolute most liveable city on Earth.", "The city was briefly called 'Batmania' after its founder.", "Recognized as the sporting capital of the world."], commercial: { companyName: "BHP GROUP", industry: "MINING & METALS", description: "A world-leading resources company extracting and processing minerals, oil, and gas primarily in Australia and the Americas.", contact: "+61 3 9609 3333", website: "https://www.bhp.com", socialHandle: "@BHP", brandColor: "#EE7113", imageUrl: "https://images.unsplash.com/photo-1578507065211-1c4e99f4d71a?auto=format&fit=crop&w=800&q=80" }, property: { title: "TOORAK MANOR", price: "$33,000,000", beds: 8, baths: 9, sqft: "14,200", description: "Tennis court, cinema, and a 5000-bottle subterranean wine cellar.", agentName: "Oliver Wright", imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80" } },
  AUCKLAND: { name: "AUCKLAND", pop: "1.7 Million", gdp: "35% of NZ", edu: "99.0% Index", facts: ["Built on top of a dormant volcanic field.", "Known as the 'City of Sails' due to yacht density.", "You can walk between the Pacific Ocean and Tasman Sea in hours.", "Auckland's Sky Tower is the tallest structure in the Southern Hemisphere."], commercial: { companyName: "FONTERRA CO-OPERATIVE", industry: "DAIRY CO-OPERATIVE", description: "A New Zealand multinational publicly traded dairy co-operative owned by over 9,000 New Zealand farmers.", contact: "+64 9 374 9000", website: "https://www.fonterra.com", socialHandle: "@Fonterra", brandColor: "#0A3B5C", imageUrl: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80" }, property: { title: "REMUERA RIDGE", price: "$16,500,000", beds: 5, baths: 6, sqft: "7,800", description: "Uninterrupted harbour views with volcanic rock architectural integrations.", agentName: "Amelia Taylor", imageUrl: "https://images.unsplash.com/photo-1600607688969-a5bfcd64bd40?auto=format&fit=crop&w=800&q=80" } },
  PERTH: { name: "PERTH", pop: "2.1 Million", gdp: "15% of Australia", edu: "99.0% Index", facts: ["Perth is the most isolated major city in the world.", "Known as the 'City of Light' since John Glenn's orbit in 1962.", "Produces a massive portion of the world's natural resources.", "Has more hours of sunshine than any other Australian city."], commercial: { companyName: "WESFARMERS", industry: "DIVERSIFIED CONGLOMERATE", description: "An Australian conglomerate with massive holdings in retail, chemicals, fertilizers, industrial and safety products.", contact: "+61 8 9327 4211", website: "https://www.wesfarmers.com.au", socialHandle: "@Wesfarmers", brandColor: "#0062A8", imageUrl: "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&w=800&q=80" }, property: { title: "PEPPERMINT GROVE VILLA", price: "$21,000,000", beds: 6, baths: 7, sqft: "9,800", description: "Swan River frontage with a 20-meter infinity pool spanning the landscape.", agentName: "Jack Evans", imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80" } }
};

export default function RightPanel() {
  const { selectedSatellite, selectedFlight, activePOI, activeContinent, setActiveContinent, showAdModal, setShowAdModal } = useAppStore();

  const selectedCity = activePOI && CITY_INTEL[activePOI] ? CITY_INTEL[activePOI] : null;

  // Randomly select a fact only when the selected city changes
  const activeFact = useMemo(() => {
    if (!selectedCity) return "";
    return selectedCity.facts[Math.floor(Math.random() * selectedCity.facts.length)];
  }, [selectedCity]);

  return (
    <>
      <div className="fixed right-6 top-6 bottom-24 w-80 flex flex-col gap-4 pointer-events-auto z-50">

        {/* Target Analytics Dossier */}
        <div className="bg-[#0b0f19] shadow-2xl border border-white/10 rounded-lg w-full h-[65%] p-6 flex flex-col overflow-hidden relative group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-xl" />

          <div className="border-b border-glass pb-2 mb-3 relative z-10 flex justify-between items-center">
            <h2 className="font-display font-bold text-lg uppercase tracking-widest text-[#00FF00]">
              ASSET DOSSIER
            </h2>
            {(!selectedSatellite && !selectedFlight) && (
              <span className="text-[9px] font-mono text-[#FF0055] animate-pulse">NO_LINK</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 no-scrollbar">
            {!selectedSatellite && !selectedFlight && !selectedCity ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                <Eye className="w-12 h-12 mb-3 text-white/30" />
                <p className="font-mono text-xs tracking-widest uppercase">Awaiting Selection</p>
                <p className="font-mono text-[9px] text-[#00FF00]/50 mt-1">Select Asset or Region...</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">

                {/* SATELLITE DOSSIER */}
                {selectedSatellite && (
                  <>
                    <div className="flex flex-col gap-1 border-l-2 border-[#00FFFF] pl-3 py-1">
                      <span className="text-[10px] font-mono text-[#00FFFF]/70 tracking-widest">CLAS: SAT_LINK</span>
                      <span className="font-display font-bold text-xl uppercase truncate">{selectedSatellite.name}</span>
                      <span className="font-mono text-xs">NORAD ID: {selectedSatellite.id}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-black/40 border border-white/5 rounded p-2 flex flex-col">
                        <span className="text-[9px] font-mono text-muted">APOGEE</span>
                        <span className="font-mono text-[#00FF00] font-bold">{selectedSatellite.apogee.toFixed(1)} km</span>
                      </div>
                      <div className="bg-black/40 border border-white/5 rounded p-2 flex flex-col">
                        <span className="text-[9px] font-mono text-muted">PERIGEE</span>
                        <span className="font-mono text-[#00FF00] font-bold">{selectedSatellite.perigee.toFixed(1)} km</span>
                      </div>
                      <div className="bg-black/40 border border-white/5 rounded p-2 flex flex-col col-span-2">
                        <span className="text-[9px] font-mono text-muted">ORBIT INCLINATION</span>
                        <span className="font-mono text-[#00FF00] font-bold">{selectedSatellite.inc.toFixed(3)}°</span>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between">
                      <span className="text-[9px] font-mono text-muted uppercase">Trajectory Lock Phase</span>
                      <span className="text-[10px] font-mono text-[#00FFFF] font-bold animate-pulse">ACTIVE</span>
                    </div>
                  </>
                )}

                {/* FLIGHT DOSSIER */}
                {selectedFlight && (
                  <>
                    <div className="flex flex-col gap-1 border-l-2 border-[#FF0055] pl-3 py-1">
                      <span className="text-[10px] font-mono text-[#FF0055]/70 tracking-widest">CLAS: AVIATION</span>
                      <span className="font-display font-bold text-xl uppercase truncate">{selectedFlight.callsign || "UNK"}</span>
                      <span className="font-mono text-xs">HEX: {selectedFlight.id}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-black/40 border border-white/5 rounded p-2 flex flex-col">
                        <span className="text-[9px] font-mono text-muted">ALTITUDE</span>
                        <span className="font-mono text-[#00FF00] font-bold">{selectedFlight.alt} M</span>
                      </div>
                      <div className="bg-black/40 border border-white/5 rounded p-2 flex flex-col">
                        <span className="text-[9px] font-mono text-muted">SPEED (MACH)</span>
                        <span className="font-mono text-[#00FF00] font-bold">{selectedFlight.mach.toFixed(2)} M</span>
                      </div>
                    </div>
                  </>
                )}


                {/* CITY DOSSIER */}
                {selectedCity && (
                  <>
                    <div className="flex flex-col gap-1 border-l-2 border-[#FFCC00] pl-3 py-1">
                      <span className="text-[10px] font-mono text-[#FFCC00]/70 tracking-widest">CLAS: REGIONAL INTEL</span>
                      <span className="font-display font-bold text-xl uppercase truncate">{selectedCity.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-black/40 border border-white/5 rounded p-2 flex flex-col">
                        <span className="text-[9px] font-mono text-muted">POPULATION</span>
                        <span className="font-mono text-[#00FF00] font-bold">{selectedCity.pop}</span>
                      </div>
                      <div className="bg-black/40 border border-white/5 rounded p-2 flex flex-col">
                        <span className="text-[9px] font-mono text-muted">GDP CONTRIBUTION</span>
                        <span className="font-mono text-[#00FF00] font-bold">{selectedCity.gdp}</span>
                      </div>
                      <div className="bg-black/40 border border-white/5 rounded p-2 flex flex-col col-span-2">
                        <span className="text-[9px] font-mono text-muted">EDUCATION INDEX</span>
                        <span className="font-mono text-[#00FF00] font-bold">{selectedCity.edu}</span>
                      </div>
                      <div className="bg-black/40 border border-white/5 rounded p-3 flex flex-col col-span-2 border-l-2 border-l-[#FFCC00]">
                        <span className="text-[9px] font-mono text-muted mb-1">FUN FACT</span>
                        <span className="font-mono text-xs text-white/90">{activeFact}</span>
                      </div>

                      <button
                        onClick={() => setShowAdModal(true)}
                        className="col-span-2 group relative mt-2 overflow-hidden bg-black/60 border border-[#FFCC00]/30 hover:border-[#FFCC00] hover:bg-[#FFCC00]/10 transition-all duration-300 rounded p-3 flex items-center justify-between"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FFCC00]/5 to-transparent -translate-x-[100%] group-hover:animate-[scan_2s_ease-in-out_infinite]" />
                        <div className="flex flex-col text-left z-10 w-full relative">
                          <span className="text-[8px] font-mono text-[#FFCC00] animate-pulse tracking-widest mb-1.5">[ DECRYPTING COMMERCIAL BEACON... ]</span>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-white group-hover:text-[#FFCC00] transition-colors" />
                            <span className="font-display font-bold text-sm tracking-widest text-white group-hover:text-[#FFCC00] transition-colors truncate">
                              {selectedCity.commercial.companyName}
                            </span>
                          </div>
                        </div>
                      </button>
                    </div>
                  </>
                )}

              </div>
            )}
          </div>
        </div>

        {/* Continent Selector */}
        <div className="bg-[#0b0f19] shadow-2xl border border-white/10 rounded-lg w-full p-4 flex flex-col gap-3 mt-auto mb-1">
          <div className="border-b border-glass pb-1">
            <h2 className="font-display font-bold text-xs uppercase tracking-widest text-[#FFCC00]">
              GLOBAL REGION
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['AFRICA', 'EUROPE', 'NORTH_AMERICA', 'SOUTH_AMERICA', 'ASIA', 'OCEANIA'].map((continent) => (
              <button
                key={continent}
                onClick={() => {
                  setActiveContinent(continent as any);
                  useAppStore.getState().setActivePOI(null); // Clear selected city when switching continent to reset view
                }}
                className={cn(
                  "px-2 py-1.5 rounded text-[10px] uppercase font-bold font-mono tracking-widest transition-all",
                  activeContinent === continent
                    ? "bg-[#FFCC00] text-black shadow-[0_0_10px_rgba(255,204,0,0.4)]"
                    : "bg-surface border border-glass text-muted hover:border-[#FFCC00]/50 hover:text-[#FFCC00]"
                )}
              >
                {continent.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>


      </div>

      {/* COMMERCIAL AD-TECH MODAL */}
      {showAdModal && selectedCity && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-md">

          {/* Holographic Container */}
          <div
            className="relative w-[500px] max-w-[90vw] animate-in zoom-in-95 fade-in duration-300 p-[1px] rounded-xl overflow-hidden shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${selectedCity.commercial.brandColor}80, transparent 40%, transparent 60%, ${selectedCity.commercial.brandColor}80)` }}
          >
            {/* Inner Black Card */}
            <div className="bg-[#0b0f19]/95 backdrop-blur-2xl rounded-xl w-full h-full p-8 relative overflow-hidden flex flex-col gap-6">

              {/* Ambient Brand Glow */}
              <div
                className="absolute top-0 right-0 w-64 h-64 opacity-20 blur-[80px] pointer-events-none rounded-full translate-x-1/3 -translate-y-1/3"
                style={{ backgroundColor: selectedCity.commercial.brandColor }}
              />

              {/* Header & Close */}
              <div className="flex justify-between items-start relative z-10 w-full">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: selectedCity.commercial.brandColor }}>
                    FEATURED ENTERPRISE // {selectedCity.name}
                  </span>
                  <h1 className="font-display font-black text-3xl text-white tracking-widest break-words" style={{ textShadow: `0 0 20px ${selectedCity.commercial.brandColor}40` }}>
                    {selectedCity.commercial.companyName}
                  </h1>
                </div>
                <button
                  onClick={() => setShowAdModal(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Industry & Description */}
              <div className="flex flex-col gap-2 relative z-10 w-full">
                <span className="px-2 py-1 bg-white/5 border border-white/10 rounded w-fit text-[9px] font-mono tracking-widest text-[#00FF00]">
                  INDUSTRY: {selectedCity.commercial.industry}
                </span>
                <p className="text-sm font-body text-white/80 leading-relaxed max-w-sm mt-2">
                  {selectedCity.commercial.description}
                </p>
              </div>

              {/* Interactive Action Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 relative z-10 w-full">

                {/* Website Link */}
                <a
                  href={selectedCity.commercial.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-black/40 border border-white/10 rounded hover:border-white/30 hover:bg-white/5 transition-all group col-span-1 md:col-span-2"
                >
                  <Globe className="w-5 h-5 text-muted group-hover:text-white transition-colors" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-mono text-muted tracking-widest group-hover:text-[#00F0FF] transition-colors">ACCESS TLD ENTRANCE</span>
                    <span className="font-mono text-xs text-white truncate">{selectedCity.commercial.website.replace('https://', '').replace('www.', '')}</span>
                  </div>
                </a>

                {/* Secure Line (Phone) */}
                <a
                  href={`tel:${selectedCity.commercial.contact.replace(/\s+/g, '')}`}
                  className="flex items-center gap-3 p-3 bg-black/40 border border-white/10 rounded hover:border-white/30 hover:bg-white/5 transition-all group"
                >
                  <Phone className="w-5 h-5 text-muted group-hover:text-white transition-colors" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] uppercase font-mono text-muted tracking-widest group-hover:text-[#00FF00] transition-colors">SECURE LINE</span>
                    <span className="font-mono text-xs text-white truncate">{selectedCity.commercial.contact}</span>
                  </div>
                </a>

                {/* Social Network */}
                <a
                  href={`https://twitter.com/${selectedCity.commercial.socialHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-black/40 border border-white/10 rounded hover:border-white/30 hover:bg-white/5 transition-all group"
                >
                  <span className="text-sm font-bold font-mono text-muted group-hover:text-white transition-colors">@</span>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] uppercase font-mono text-muted tracking-widest group-hover:text-[#FF0055] transition-colors">SOCIAL STREAM</span>
                    <span className="font-mono text-xs text-white truncate">{selectedCity.commercial.socialHandle}</span>
                  </div>
                </a>

              </div>

              {/* Dynamic High Definition Commercial Imagery */}
              <div className="w-full h-48 mt-2 rounded border border-white/10 overflow-hidden relative group/img z-10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                <img
                  src={selectedCity.commercial.imageUrl}
                  alt={`${selectedCity.commercial.companyName} Architecture/Brand`}
                  className="w-full h-full object-cover object-center group-hover/img:scale-105 transition-transform duration-700 opacity-80 group-hover/img:opacity-100"
                />
                <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse blur-[1px]" style={{ backgroundColor: selectedCity.commercial.brandColor }} />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#00FF00]">
                   // OPTICAL VERIFICATION LOG
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
