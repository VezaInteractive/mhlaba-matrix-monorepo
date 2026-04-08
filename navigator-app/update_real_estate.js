const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('c:/Users/mrmaf/OneDrive/Desktop/Mhlaba Matrix 2/navigator-app/src/components/HUD/RightPanel.tsx');

let content = fs.readFileSync(targetFile, 'utf8');

const properties = [
    { title: "THE HOUGHTON PENTHOUSE", price: "$4,200,000", beds: 4, baths: 5, sqft: "6,500", agent: "Marcus Vance", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80", desc: "Ultra-luxury penthouse overlooking the world's largest urban forest." },
    { title: "CLIFTON HYPER-VILLA", price: "$14,500,000", beds: 6, baths: 7, sqft: "12,000", agent: "Elena Rostova", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80", desc: "Seamless oceanic horizon integration with multi-deck infinity pools." },
    { title: "WATERKLOOF ESTATE", price: "$2,800,000", beds: 5, baths: 6, sqft: "8,500", agent: "Johan De Beer", img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80", desc: "Diplomatic-grade secure luxury compound in the capital's heart." },
    { title: "UMHLANGA PEARL", price: "$3,600,000", beds: 3, baths: 4, sqft: "4,200", agent: "Priya Naidoo", img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80", desc: "Bespoke beachfront sky-mansion with private biometric elevator access." },
    { title: "MAYFAIR TOWNHOUSE", price: "$28,000,000", beds: 7, baths: 8, sqft: "9,000", agent: "Lord H. Kensington", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80", desc: "Heritage listed exterior boasting a subterranean cybernetic leisure complex." },
    { title: "MITTE KREUZBERG LOFT", price: "$6,500,000", beds: 2, baths: 3, sqft: "3,800", agent: "Lukas Weber", img: "https://images.unsplash.com/photo-1600607688969-a5bfcd64bd40?auto=format&fit=crop&w=800&q=80", desc: "Converted brutalist architecture featuring smart-glass panoramic walls." },
    { title: "AVENUE MONTAIGNE MAISON", price: "$34,000,000", beds: 5, baths: 5, sqft: "7,500", agent: "Camille Dubois", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80", desc: "Direct Eiffel Tower views locked behind military-grade security systems." },
    { title: "VILLA BORGHESE ESTATE", price: "$18,500,000", beds: 8, baths: 10, sqft: "14,000", agent: "Marco Rossi", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80", desc: "Renaissance aesthetics paired with next-generation neuro-home automation." },
    { title: "BILLIONAIRES ROW PENTHOUSE", price: "$85,000,000", beds: 4, baths: 6, sqft: "8,000", agent: "Victoria Chase", img: "https://images.unsplash.com/photo-1628611225249-6c4ff5aa35b6?auto=format&fit=crop&w=800&q=80", desc: "Suspended 1,200ft above Central Park. The pinnacle of global wealth." },
    { title: "BEL AIR MEGAMANSION", price: "$120,000,000", beds: 12, baths: 18, sqft: "38,000", agent: "Caleb Sterling", img: "https://images.unsplash.com/photo-1613490908592-fd0a5a3bdcb8?auto=format&fit=crop&w=800&q=80", desc: "Includes a private nightclub, indoor waterfall, and 20-car showcase garage." },
    { title: "BRIDLE PATH CHATEAU", price: "$22,000,000", beds: 9, baths: 12, sqft: "18,500", agent: "Sarah Jenkins", img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80", desc: "Heated driveways and a climate-controlled indoor botanical garden." },
    { title: "POLANCO SKY-VILLA", price: "$9,800,000", beds: 4, baths: 5, sqft: "6,200", agent: "Javier Martinez", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80", desc: "Cantilevered infinity pool overlooking the entire Chapultepec Park." },
    { title: "JARDINS COMPOUND", price: "$15,500,000", beds: 7, baths: 9, sqft: "11,000", agent: "Beatriz Silva", img: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80", desc: "Features a private helipad and subterranean 3-level bunker." },
    { title: "PUERTO MADERO DUPLEX", price: "$7,200,000", beds: 3, baths: 4, sqft: "4,800", agent: "Mateo Gonzalez", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80", desc: "River-front panoramic floor-to-ceiling smart-glass architecture." },
    { title: "ROSALES MANSION", price: "$5,900,000", beds: 5, baths: 6, sqft: "7,200", agent: "Luciana Mendez", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80", desc: "Nestled in the eastern mountains with an integrated oxygen-enrichment HVAC." },
    { title: "SAN ISIDRO PALACE", price: "$4,500,000", beds: 6, baths: 7, sqft: "8,200", agent: "Diego Vargas", img: "https://images.unsplash.com/photo-1600607688969-a5bfcd64bd40?auto=format&fit=crop&w=800&q=80", desc: "Colonial shell housing an entirely digitized neural-link ready luxury space." },
    { title: "MINATO-KU SANCTUARY", price: "$42,000,000", beds: 5, baths: 6, sqft: "5,500", agent: "Kenji Tanaka", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80", desc: "Ultra-minimalist design featuring a holographic Zen garden." },
    { title: "PUDONG SKY-PALACE", price: "$38,000,000", beds: 6, baths: 8, sqft: "9,500", agent: "Wei Chen", img: "https://images.unsplash.com/photo-1628611225249-6c4ff5aa35b6?auto=format&fit=crop&w=800&q=80", desc: "Located on the 95th floor with a private magnetic levitation pod bay." },
    { title: "MALABAR HILL ESTATE", price: "$65,000,000", beds: 10, baths: 12, sqft: "22,000", agent: "Aarav Patel", img: "https://images.unsplash.com/photo-1613490908592-fd0a5a3bdcb8?auto=format&fit=crop&w=800&q=80", desc: "Arabian sea panoramas, fully staffed, and self-sufficient energy grid." },
    { title: "MARINA BAY TRANQUILITY", price: "$26,000,000", beds: 4, baths: 5, sqft: "4,600", agent: "Chloe Lim", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80", desc: "Direct views of the Supertrees with a private indoor arboretum." },
    { title: "POINT PIPER WATERFRONT", price: "$48,000,000", beds: 6, baths: 7, sqft: "11,500", agent: "Harrison Ford", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80", desc: "Deep water mooring for superyachts and a glass-bottom cantilevered pool." },
    { title: "TOORAK MANOR", price: "$33,000,000", beds: 8, baths: 9, sqft: "14,200", agent: "Oliver Wright", img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80", desc: "Tennis court, cinema, and a 5000-bottle subterranean wine cellar." },
    { title: "REMUERA RIDGE", price: "$16,500,000", beds: 5, baths: 6, sqft: "7,800", agent: "Amelia Taylor", img: "https://images.unsplash.com/photo-1600607688969-a5bfcd64bd40?auto=format&fit=crop&w=800&q=80", desc: "Uninterrupted harbour views with volcanic rock architectural integrations." },
    { title: "PEPPERMINT GROVE VILLA", price: "$21,000,000", beds: 6, baths: 7, sqft: "9,800", agent: "Jack Evans", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80", desc: "Swan River frontage with a 20-meter infinity pool spanning the landscape." }
];

let propIndex = 0;

// Match commercial block closing brace
const regex = /(commercial:\s*\{[^{}]*\}\s*)\}/g;

let matches = 0;
// Note: We only replace if we haven't already injected the property object. Oh wait, I just added `property:` in the interface, not the object.
// So I can safely inject `, property: { ... } }`
content = content.replace(regex, (match, commercialBlock) => {
    if (propIndex >= properties.length) return match;
    
    // Check if property already exists inside the matched object line
    if (commercialBlock.includes('property: {')) return match;

    const p = properties[propIndex++];
    matches++;
    
    const propString = `, property: { title: "${p.title}", price: "${p.price}", beds: ${p.beds}, baths: ${p.baths}, sqft: "${p.sqft}", description: "${p.desc}", agentName: "${p.agent}", imageUrl: "${p.img}" } }`;
    
    return commercialBlock + propString;
});

if (matches === 24) {
    fs.writeFileSync(targetFile, content);
    console.log("Successfully injected 24 property objects into CITY_INTEL!");
} else {
    console.error("Match count failed! Expected 24, got " + matches);
}
