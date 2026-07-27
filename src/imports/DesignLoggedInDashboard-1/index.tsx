import svgPaths from "./svg-ba6wxdhjqp";
import imgImage from "./47e3373b9352fd5ecdd9d8e659b4f333e40a362a.png";
import imgImageNeonRequiemCoverArt from "./61d342fe7d7ecfd99b7d3338301506e98908d017.png";
import imgImageDvdStandardReleasePackaging from "./5063693e98f9954bae98330f71536c93635ff649.png";
import imgImageBluRayStandardEditionPackaging from "./134f42266137fba60800215bd683722602d2fb4a.png";
import imgImageBluRaySteelbookFnacExclusivePackaging from "./9f03197716c78ce3e0c31682361f5221f6e3365b.png";
import imgImage4KUhdCollectorsBoxSetPackaging from "./a419de0897e8eb642323f5a81cceea4a3684afd9.png";

function Image() {
  return (
    <div className="absolute blur-[32.2px] h-[657.8px] left-[-119.7px] opacity-40 top-[-42.9px] w-[1835.4px]" data-name="Image">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage} />
    </div>
  );
}

function ImageTransform() {
  return (
    <div className="h-[572px] relative shrink-0 w-full" data-name="Image:transform">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Image />
      </div>
    </div>
  );
}

function Container3() {
  return <div className="absolute bg-gradient-to-b from-[rgba(20,24,28,0.5)] h-[572px] left-0 to-[#14181c] top-0 via-[60%] via-[rgba(20,24,28,0.85)] w-[1596px]" data-name="Container" />;
}

function Container2() {
  return (
    <div className="absolute content-stretch flex flex-col h-[572px] items-start left-0 overflow-clip top-0 w-[1596px]" data-name="Container">
      <ImageTransform />
      <Container3 />
    </div>
  );
}

function ImageNeonRequiemCoverArt() {
  return (
    <div className="h-[418px] relative shrink-0 w-full" data-name="Image (Neon Requiem cover art)">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImageNeonRequiemCoverArt} />
    </div>
  );
}

function Container5() {
  return (
    <div className="bg-[rgba(255,255,255,0)] h-[420px] relative rounded-[8px] shrink-0 w-[280px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] size-full">
        <ImageNeonRequiemCoverArt />
      </div>
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]" />
    </div>
  );
}

function Heading() {
  return (
    <div className="relative shrink-0 w-full" data-name="Heading 1">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Bold',sans-serif] font-bold leading-[0] not-italic relative shrink-0 text-[#e8e8e8] text-[0px] whitespace-nowrap">
          <span className="leading-[32.2px] text-[28px]">{`Neon Requiem `}</span>
          <span className="font-['Inter:Regular',sans-serif] font-normal leading-[32.2px] text-[#8a8f98] text-[28px]">(2024)</span>
        </p>
      </div>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[27px] relative shrink-0 w-[1008px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[4px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#8a8f98] text-[15px] whitespace-nowrap">
          <span className="leading-[22.5px]">{`Directed by `}</span>
          <span className="leading-[22.5px] text-[#e8e8e8]">Isadora Vance</span>
          <span className="leading-[22.5px]">{` · 2h 17m`}</span>
        </p>
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Heading />
        <Paragraph />
      </div>
    </div>
  );
}

function Text() {
  return (
    <div className="bg-[#1f242a] relative rounded-[16777200px] self-stretch shrink-0" data-name="Text">
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[11px] py-[5px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[13px] whitespace-nowrap">Neo-noir</p>
      </div>
    </div>
  );
}

function Text1() {
  return (
    <div className="bg-[#1f242a] relative rounded-[16777200px] self-stretch shrink-0" data-name="Text">
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[11px] py-[5px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[13px] whitespace-nowrap">Sci-fi</p>
      </div>
    </div>
  );
}

function Text2() {
  return (
    <div className="bg-[#1f242a] relative rounded-[16777200px] self-stretch shrink-0" data-name="Text">
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[11px] py-[5px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[13px] whitespace-nowrap">Thriller</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="h-[30px] relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-start relative size-full">
        <Text />
        <Text1 />
        <Text2 />
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="18" preserveAspectRatio="none" viewBox="0 0 18 18" width="18">
        <g id="Icon">
          <path d={svgPaths.pe1f5000} fill="var(--fill-0, #2E7DFF)" id="Vector" stroke="var(--stroke-0, #2E7DFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Text4() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[22.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[15px] whitespace-nowrap">4.3</p>
      </div>
    </div>
  );
}

function Text5() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">/ 5 · 1 842 ratings</p>
      </div>
    </div>
  );
}

function Text3() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <Icon />
        <Text4 />
        <Text5 />
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d={svgPaths.p1b24c700} id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Text7() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[19.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[13px] whitespace-nowrap">1 204</p>
      </div>
    </div>
  );
}

function Text6() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <Icon1 />
        <Text7 />
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">own this</p>
      </div>
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d={svgPaths.p13f2e300} id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Text9() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[19.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[13px] whitespace-nowrap">312</p>
      </div>
    </div>
  );
}

function Text8() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <Icon2 />
        <Text9 />
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">want this</p>
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[24px] items-center relative size-full">
        <Text3 />
        <Text6 />
        <Text8 />
      </div>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="max-w-[640px] relative shrink-0 w-full" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start max-w-[inherit] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[24px] not-italic relative shrink-0 text-[#e8e8e8] text-[15px] w-[640px]">In a rain-drenched megacity where memories are traded like currency, a burnt-out data-courier takes one last job that unravels a conspiracy reaching the highest towers of the corporate elite. As neon bleeds across flooded streets, she must decide which of her own memories are worth keeping — and which were never hers to begin with.</p>
      </div>
    </div>
  );
}

function Icon3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d="M3.33333 8H12.6667" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 3.33333V12.6667" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#2e7dff] h-full relative rounded-bl-[16777200px] rounded-tl-[16777200px] shrink-0" data-name="Button">
      <div aria-hidden className="absolute border border-[#2e7dff] border-solid inset-0 pointer-events-none rounded-bl-[16777200px] rounded-tl-[16777200px]" />
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center pl-[17px] pr-[13px] py-[9px] relative size-full">
          <Icon3 />
          <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[22.5px] not-italic relative shrink-0 text-[15px] text-center text-white whitespace-nowrap">Add to Collection</p>
        </div>
      </div>
    </div>
  );
}

function Icon4() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d="M4 6L8 10L12 6" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToCollectionChooseASpecificEdition() {
  return (
    <div className="bg-[#2e7dff] h-full relative rounded-br-[16777200px] rounded-tr-[16777200px] shrink-0" data-name="Button - Add to Collection — choose a specific edition">
      <div aria-hidden className="absolute border border-[rgba(255,255,255,0.3)] border-solid inset-0 pointer-events-none rounded-br-[16777200px] rounded-tr-[16777200px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center px-[9px] py-px relative size-full">
        <Icon4 />
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="h-full relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <Button />
        <ButtonAddToCollectionChooseASpecificEdition />
      </div>
    </div>
  );
}

function Icon5() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d={svgPaths.p13f2e300} id="Vector" stroke="var(--stroke-0, #2E7DFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Button1() {
  return (
    <div className="h-full relative rounded-bl-[16777200px] rounded-tl-[16777200px] shrink-0" data-name="Button">
      <div aria-hidden className="absolute border border-[#2e7dff] border-solid inset-0 pointer-events-none rounded-bl-[16777200px] rounded-tl-[16777200px]" />
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center pl-[17px] pr-[13px] py-[9px] relative size-full">
          <Icon5 />
          <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[22.5px] not-italic relative shrink-0 text-[#2e7dff] text-[15px] text-center whitespace-nowrap">Add to Wishlist</p>
        </div>
      </div>
    </div>
  );
}

function Icon6() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d="M4 6L8 10L12 6" id="Vector" stroke="var(--stroke-0, #2E7DFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToWishlistChooseASpecificEdition() {
  return (
    <div className="h-full relative rounded-br-[16777200px] rounded-tr-[16777200px] shrink-0" data-name="Button - Add to Wishlist — choose a specific edition">
      <div aria-hidden className="absolute border border-[#2e7dff] border-solid inset-0 pointer-events-none rounded-br-[16777200px] rounded-tr-[16777200px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center px-[9px] py-px relative size-full">
        <Icon6 />
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="h-full relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <Button1 />
        <ButtonAddToWishlistChooseASpecificEdition />
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="h-[44.5px] relative shrink-0 w-[1008px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[10px] items-start pt-[4px] relative size-full">
        <Container11 />
        <Container12 />
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="flex-[1008_0_0] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[12px] items-start relative size-full">
        <Container7 />
        <Container8 />
        <Container9 />
        <Paragraph1 />
        <Container10 />
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute content-stretch flex gap-[24px] items-start left-[78px] max-w-[1440px] px-[64px] py-[40px] top-[72px] w-[1440px]" data-name="Container">
      <Container5 />
      <Container6 />
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[572px] relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container2 />
        <Container4 />
      </div>
    </div>
  );
}

function Text10() {
  return <div className="absolute bg-[#2e7dff] h-[2px] left-[8px] rounded-[16777200px] top-[45.5px] w-[74.141px]" data-name="Text" />;
}

function Tab() {
  return (
    <div className="h-full relative shrink-0" data-name="Tab">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center px-[16px] py-[12px] relative size-full">
          <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[22.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[15px] text-center whitespace-nowrap">Editions</p>
          <Text10 />
        </div>
      </div>
    </div>
  );
}

function Tab1() {
  return (
    <div className="h-full relative shrink-0" data-name="Tab">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center px-[16px] py-[12px] relative size-full">
          <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[22.5px] not-italic relative shrink-0 text-[#8a8f98] text-[15px] text-center whitespace-nowrap">Details</p>
        </div>
      </div>
    </div>
  );
}

function Tab2() {
  return (
    <div className="h-full relative shrink-0" data-name="Tab">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center px-[16px] py-[12px] relative size-full">
          <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[22.5px] not-italic relative shrink-0 text-[#8a8f98] text-[15px] text-center whitespace-nowrap">Reviews</p>
        </div>
      </div>
    </div>
  );
}

function Tab3() {
  return (
    <div className="h-full relative shrink-0" data-name="Tab">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center px-[16px] py-[12px] relative size-full">
          <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[22.5px] not-italic relative shrink-0 text-[#8a8f98] text-[15px] text-center whitespace-nowrap">Lists</p>
        </div>
      </div>
    </div>
  );
}

function TabList() {
  return (
    <div className="content-stretch flex gap-[4px] h-[46.5px] items-start max-w-[1440px] overflow-clip px-[64px] relative shrink-0 w-[1440px]" data-name="Tab List">
      <Tab />
      <Tab1 />
      <Tab2 />
      <Tab3 />
    </div>
  );
}

function ContainerMargin() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative size-full">
        <TabList />
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="bg-[#14181c] relative shrink-0 w-full" data-name="Container">
      <div aria-hidden className="absolute border-[#2a3138] border-b border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-px relative size-full">
        <ContainerMargin />
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-[#1f242a] h-full relative rounded-[16777200px] shrink-0" data-name="Button">
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <div className="flex flex-col items-center justify-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center px-[13px] py-[7px] relative size-full">
          <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] text-center whitespace-nowrap">4K UHD</p>
        </div>
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="bg-[#1f242a] h-full relative rounded-[16777200px] shrink-0" data-name="Button">
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <div className="flex flex-col items-center justify-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center px-[13px] py-[7px] relative size-full">
          <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] text-center whitespace-nowrap">Blu-ray</p>
        </div>
      </div>
    </div>
  );
}

function Button4() {
  return (
    <div className="bg-[#1f242a] h-full relative rounded-[16777200px] shrink-0" data-name="Button">
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <div className="flex flex-col items-center justify-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center px-[13px] py-[7px] relative size-full">
          <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] text-center whitespace-nowrap">DVD</p>
        </div>
      </div>
    </div>
  );
}

function Button5() {
  return (
    <div className="bg-[#1f242a] h-full relative rounded-[16777200px] shrink-0" data-name="Button">
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <div className="flex flex-col items-center justify-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center px-[13px] py-[7px] relative size-full">
          <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] text-center whitespace-nowrap">Steelbook</p>
        </div>
      </div>
    </div>
  );
}

function Button6() {
  return (
    <div className="bg-[#1f242a] h-full relative rounded-[16777200px] shrink-0" data-name="Button">
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <div className="flex flex-col items-center justify-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center px-[13px] py-[7px] relative size-full">
          <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] text-center whitespace-nowrap">Digibook</p>
        </div>
      </div>
    </div>
  );
}

function Button7() {
  return (
    <div className="bg-[#1f242a] h-full relative rounded-[16777200px] shrink-0" data-name="Button">
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <div className="flex flex-col items-center justify-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center px-[13px] py-[7px] relative size-full">
          <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] text-center whitespace-nowrap">Box Set</p>
        </div>
      </div>
    </div>
  );
}

function FilterByFormat() {
  return (
    <div className="h-[37.5px] relative shrink-0 w-full" data-name="Filter by format">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-start overflow-clip pb-[4px] relative rounded-[inherit] size-full">
        <Button2 />
        <Button3 />
        <Button4 />
        <Button5 />
        <Button6 />
        <Button7 />
      </div>
    </div>
  );
}

function DropdownRegion() {
  return (
    <div className="bg-[#1f242a] h-[33.5px] relative rounded-[16777200px] shrink-0 w-[172px]" data-name="Dropdown - Region">
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
    </div>
  );
}

function Icon7() {
  return (
    <div className="absolute left-[148px] size-[14px] top-[9.75px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="14" preserveAspectRatio="none" viewBox="0 0 14 14" width="14">
        <g id="Icon">
          <path d="M3.5 5.25L7 8.75L10.5 5.25" id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
        </g>
      </svg>
    </div>
  );
}

function Label() {
  return (
    <div className="relative shrink-0" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <DropdownRegion />
        <Icon7 />
      </div>
    </div>
  );
}

function DropdownYear() {
  return (
    <div className="bg-[#1f242a] h-[33.5px] relative rounded-[16777200px] shrink-0 w-[116.5px]" data-name="Dropdown - Year">
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
    </div>
  );
}

function Icon8() {
  return (
    <div className="absolute left-[92.5px] size-[14px] top-[9.75px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="14" preserveAspectRatio="none" viewBox="0 0 14 14" width="14">
        <g id="Icon">
          <path d="M3.5 5.25L7 8.75L10.5 5.25" id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
        </g>
      </svg>
    </div>
  );
}

function Label1() {
  return (
    <div className="relative shrink-0" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <DropdownYear />
        <Icon8 />
      </div>
    </div>
  );
}

function DropdownSort() {
  return (
    <div className="bg-[#1f242a] h-[33.5px] relative rounded-[16777200px] shrink-0 w-[181.5px]" data-name="Dropdown - Sort">
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
    </div>
  );
}

function Icon9() {
  return (
    <div className="absolute left-[157.5px] size-[14px] top-[9.75px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="14" preserveAspectRatio="none" viewBox="0 0 14 14" width="14">
        <g id="Icon">
          <path d="M3.5 5.25L7 8.75L10.5 5.25" id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
        </g>
      </svg>
    </div>
  );
}

function Label2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Label">
      <DropdownSort />
      <Icon9 />
    </div>
  );
}

function ContainerAlign() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="Container:align">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start justify-end relative size-full">
        <Label2 />
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Label />
        <Label1 />
        <ContainerAlign />
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[12px] items-start relative size-full">
        <FilterByFormat />
        <Container15 />
      </div>
    </div>
  );
}

function ImageDvdStandardReleasePackaging() {
  return (
    <div className="h-[84px] relative shrink-0 w-full" data-name="Image (DVD — Standard Release packaging)">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImageDvdStandardReleasePackaging} />
    </div>
  );
}

function Container16() {
  return (
    <div className="h-[84px] relative rounded-[8px] shrink-0 w-[56px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <ImageDvdStandardReleasePackaging />
      </div>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="h-[22.5px] relative shrink-0 w-[1128px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[22.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[15px] whitespace-nowrap">DVD — Standard Release</p>
      </div>
    </div>
  );
}

function Text11() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[8px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">DVD</p>
      </div>
    </div>
  );
}

function Text12() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[8px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">Region 2</p>
      </div>
    </div>
  );
}

function Text13() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[8px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">France</p>
      </div>
    </div>
  );
}

function Text14() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">2024</p>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <Text11 />
        <Text12 />
        <Text13 />
        <Text14 />
      </div>
    </div>
  );
}

function Icon10() {
  return (
    <div className="relative shrink-0 size-[11px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="11" preserveAspectRatio="none" viewBox="0 0 11 11" width="11">
        <g clipPath="url(#clip0_22_1073)" id="Icon">
          <path d="M6.875 1.375H9.625V4.125" id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
          <path d="M4.58333 6.41667L9.625 1.375" id="Vector_2" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
          <path d={svgPaths.p2c2ae900} id="Vector_3" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
        </g>
        <defs>
          <clipPath id="clip0_22_1073">
            <rect fill="white" height="11" width="11" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text16() {
  return (
    <div className="absolute content-stretch flex gap-[2px] items-center left-[48.75px] top-[1.25px]" data-name="Text">
      <Icon10 />
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">eBay</p>
    </div>
  );
}

function Text15() {
  return (
    <div className="h-[22.5px] relative shrink-0 w-[163.445px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="[word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[22.5px] left-0 not-italic text-[#e8e8e8] text-[15px] top-0 whitespace-nowrap">$9.99</p>
        <Text16 />
        <p className="[word-break:break-word] absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[98.26px] not-italic text-[#8a8f98] text-[11px] top-[4.5px] whitespace-nowrap">· affiliate link</p>
      </div>
    </div>
  );
}

function Text19() {
  return (
    <div className="absolute bg-[#3a4450] content-stretch flex items-center justify-center left-0 rounded-[16777200px] size-[20px] top-[3.75px]" data-name="Text">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[11px] whitespace-nowrap">TV</p>
    </div>
  );
}

function Text18() {
  return (
    <div className="bg-[rgba(255,255,255,0)] h-[24px] relative rounded-[9999px] shadow-[0px_0px_0px_0px_#1f242a] shrink-0 w-[20px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text19 />
      </div>
    </div>
  );
}

function Text20() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">88 own this</p>
      </div>
    </div>
  );
}

function Text17() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <Text18 />
        <Text20 />
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Text15 />
        <Text17 />
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="flex-[1128_0_0] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6px] items-start relative size-full">
        <Paragraph2 />
        <Container18 />
        <Container19 />
      </div>
    </div>
  );
}

function Icon11() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d="M3.33333 8H12.6667" id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 3.33333V12.6667" id="Vector_2" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToCollection() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0 size-[36px]" data-name="Button - Add to collection">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon11 />
      </div>
    </div>
  );
}

function Icon12() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d={svgPaths.p13f2e300} id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToWishlist() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0 size-[36px]" data-name="Button - Add to wishlist">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon12 />
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <ButtonAddToCollection />
        <ButtonAddToWishlist />
      </div>
    </div>
  );
}

function ButtonDvdStandardReleaseOpenEditionDetails() {
  return (
    <div className="bg-[#1f242a] relative rounded-[12px] shrink-0 w-full" data-name="Button - DVD — Standard Release. Open edition details.">
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center p-[13px] relative size-full">
          <Container16 />
          <Container17 />
          <Container20 />
        </div>
      </div>
    </div>
  );
}

function ImageBluRayStandardEditionPackaging() {
  return (
    <div className="h-[84px] relative shrink-0 w-full" data-name="Image (Blu-ray Standard Edition packaging)">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImageBluRayStandardEditionPackaging} />
    </div>
  );
}

function Container21() {
  return (
    <div className="h-[84px] relative rounded-[8px] shrink-0 w-[56px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <ImageBluRayStandardEditionPackaging />
      </div>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="h-[22.5px] relative shrink-0 w-[1128px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[22.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[15px] whitespace-nowrap">Blu-ray Standard Edition</p>
      </div>
    </div>
  );
}

function Text21() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[8px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">Blu-ray</p>
      </div>
    </div>
  );
}

function Text22() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[8px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">Region B</p>
      </div>
    </div>
  );
}

function Text23() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[8px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">Germany</p>
      </div>
    </div>
  );
}

function Text24() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">2024</p>
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <Text21 />
        <Text22 />
        <Text23 />
        <Text24 />
      </div>
    </div>
  );
}

function Icon13() {
  return (
    <div className="relative shrink-0 size-[11px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="11" preserveAspectRatio="none" viewBox="0 0 11 11" width="11">
        <g clipPath="url(#clip0_22_1073)" id="Icon">
          <path d="M6.875 1.375H9.625V4.125" id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
          <path d="M4.58333 6.41667L9.625 1.375" id="Vector_2" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
          <path d={svgPaths.p2c2ae900} id="Vector_3" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
        </g>
        <defs>
          <clipPath id="clip0_22_1073">
            <rect fill="white" height="11" width="11" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text26() {
  return (
    <div className="absolute content-stretch flex gap-[2px] items-center left-[55.05px] top-[1.25px]" data-name="Text">
      <Icon13 />
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">eBay</p>
    </div>
  );
}

function Text25() {
  return (
    <div className="h-[22.5px] relative shrink-0 w-[169.742px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="[word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[22.5px] left-0 not-italic text-[#e8e8e8] text-[15px] top-0 whitespace-nowrap">$16.99</p>
        <Text26 />
        <p className="[word-break:break-word] absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[104.55px] not-italic text-[#8a8f98] text-[11px] top-[4.5px] whitespace-nowrap">· affiliate link</p>
      </div>
    </div>
  );
}

function Text30() {
  return (
    <div className="absolute bg-[#3d4552] content-stretch flex items-center justify-center left-0 rounded-[16777200px] size-[20px] top-[3.75px]" data-name="Text">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[11px] whitespace-nowrap">LF</p>
    </div>
  );
}

function Text29() {
  return (
    <div className="bg-[rgba(255,255,255,0)] h-[24px] relative rounded-[9999px] shadow-[0px_0px_0px_0px_#1f242a] shrink-0 w-[20px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text30 />
      </div>
    </div>
  );
}

function Text32() {
  return (
    <div className="absolute bg-[#3d4a45] content-stretch flex items-center justify-center left-0 rounded-[16777200px] size-[20px] top-[3.75px]" data-name="Text">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[11px] whitespace-nowrap">PR</p>
    </div>
  );
}

function Text31() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] h-[24px] left-[-8px] rounded-[9999px] shadow-[0px_0px_0px_0px_#1f242a] top-0 w-[20px]" data-name="Text">
      <Text32 />
    </div>
  );
}

function TextMargin() {
  return (
    <div className="h-[24px] relative shrink-0 w-[12px]" data-name="Text:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Text31 />
      </div>
    </div>
  );
}

function Text28() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <Text29 />
        <TextMargin />
      </div>
    </div>
  );
}

function Text33() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">512 own this</p>
      </div>
    </div>
  );
}

function Text27() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <Text28 />
        <Text33 />
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Text25 />
        <Text27 />
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="flex-[1128_0_0] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6px] items-start relative size-full">
        <Paragraph3 />
        <Container23 />
        <Container24 />
      </div>
    </div>
  );
}

function Icon14() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d="M3.33333 8H12.6667" id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 3.33333V12.6667" id="Vector_2" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToCollection1() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0 size-[36px]" data-name="Button - Add to collection">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon14 />
      </div>
    </div>
  );
}

function Icon15() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d={svgPaths.p13f2e300} id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToWishlist1() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0 size-[36px]" data-name="Button - Add to wishlist">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon15 />
      </div>
    </div>
  );
}

function Container25() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <ButtonAddToCollection1 />
        <ButtonAddToWishlist1 />
      </div>
    </div>
  );
}

function ButtonBluRayStandardEditionOpenEditionDetails() {
  return (
    <div className="bg-[#1f242a] relative rounded-[12px] shrink-0 w-full" data-name="Button - Blu-ray Standard Edition. Open edition details.">
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center p-[13px] relative size-full">
          <Container21 />
          <Container22 />
          <Container25 />
        </div>
      </div>
    </div>
  );
}

function ImageBluRaySteelbookFnacExclusivePackaging() {
  return (
    <div className="h-[84px] relative shrink-0 w-full" data-name="Image (Blu-ray Steelbook — FNAC Exclusive packaging)">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImageBluRaySteelbookFnacExclusivePackaging} />
    </div>
  );
}

function Container26() {
  return (
    <div className="h-[84px] relative rounded-[8px] shrink-0 w-[56px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <ImageBluRaySteelbookFnacExclusivePackaging />
      </div>
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="h-[22.5px] relative shrink-0 w-[1128px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[22.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[15px] whitespace-nowrap">Blu-ray Steelbook — FNAC Exclusive</p>
      </div>
    </div>
  );
}

function Text34() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[8px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">Steelbook</p>
      </div>
    </div>
  );
}

function Text35() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[8px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">Region B</p>
      </div>
    </div>
  );
}

function Text36() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[8px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">France</p>
      </div>
    </div>
  );
}

function Text37() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">2025</p>
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <Text34 />
        <Text35 />
        <Text36 />
        <Text37 />
      </div>
    </div>
  );
}

function Icon16() {
  return (
    <div className="relative shrink-0 size-[11px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="11" preserveAspectRatio="none" viewBox="0 0 11 11" width="11">
        <g clipPath="url(#clip0_22_1073)" id="Icon">
          <path d="M6.875 1.375H9.625V4.125" id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
          <path d="M4.58333 6.41667L9.625 1.375" id="Vector_2" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
          <path d={svgPaths.p2c2ae900} id="Vector_3" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
        </g>
        <defs>
          <clipPath id="clip0_22_1073">
            <rect fill="white" height="11" width="11" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text39() {
  return (
    <div className="absolute content-stretch flex gap-[2px] items-center left-[58.17px] top-[1.25px]" data-name="Text">
      <Icon16 />
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">eBay</p>
    </div>
  );
}

function Text38() {
  return (
    <div className="h-[22.5px] relative shrink-0 w-[172.867px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="[word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[22.5px] left-0 not-italic text-[#e8e8e8] text-[15px] top-0 whitespace-nowrap">$24.99</p>
        <Text39 />
        <p className="[word-break:break-word] absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[107.68px] not-italic text-[#8a8f98] text-[11px] top-[4.5px] whitespace-nowrap">· affiliate link</p>
      </div>
    </div>
  );
}

function Text43() {
  return (
    <div className="absolute bg-[#3d4a45] content-stretch flex items-center justify-center left-0 rounded-[16777200px] size-[20px] top-[3.75px]" data-name="Text">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[11px] whitespace-nowrap">PR</p>
    </div>
  );
}

function Text42() {
  return (
    <div className="bg-[rgba(255,255,255,0)] h-[24px] relative rounded-[9999px] shadow-[0px_0px_0px_0px_#1f242a] shrink-0 w-[20px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text43 />
      </div>
    </div>
  );
}

function Text45() {
  return (
    <div className="absolute bg-[#3d4552] content-stretch flex items-center justify-center left-0 rounded-[16777200px] size-[20px] top-[3.75px]" data-name="Text">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[11px] whitespace-nowrap">LF</p>
    </div>
  );
}

function Text44() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] h-[24px] left-[-8px] rounded-[9999px] shadow-[0px_0px_0px_0px_#1f242a] top-0 w-[20px]" data-name="Text">
      <Text45 />
    </div>
  );
}

function TextMargin1() {
  return (
    <div className="h-[24px] relative shrink-0 w-[12px]" data-name="Text:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Text44 />
      </div>
    </div>
  );
}

function Text47() {
  return (
    <div className="absolute bg-[#4a3d3d] content-stretch flex items-center justify-center left-0 rounded-[16777200px] size-[20px] top-[3.75px]" data-name="Text">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[11px] whitespace-nowrap">AD</p>
    </div>
  );
}

function Text46() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] h-[24px] left-[-8px] rounded-[9999px] shadow-[0px_0px_0px_0px_#1f242a] top-0 w-[20px]" data-name="Text">
      <Text47 />
    </div>
  );
}

function TextMargin2() {
  return (
    <div className="h-[24px] relative shrink-0 w-[12px]" data-name="Text:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Text46 />
      </div>
    </div>
  );
}

function Text41() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <Text42 />
        <TextMargin1 />
        <TextMargin2 />
      </div>
    </div>
  );
}

function Text48() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">201 own this</p>
      </div>
    </div>
  );
}

function Text40() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <Text41 />
        <Text48 />
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Text38 />
        <Text40 />
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="flex-[1128_0_0] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6px] items-start relative size-full">
        <Paragraph4 />
        <Container28 />
        <Container29 />
      </div>
    </div>
  );
}

function Icon17() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d="M3.33333 8H12.6667" id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 3.33333V12.6667" id="Vector_2" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToCollection2() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0 size-[36px]" data-name="Button - Add to collection">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon17 />
      </div>
    </div>
  );
}

function Icon18() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d={svgPaths.p13f2e300} id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToWishlist2() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0 size-[36px]" data-name="Button - Add to wishlist">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon18 />
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <ButtonAddToCollection2 />
        <ButtonAddToWishlist2 />
      </div>
    </div>
  );
}

function ButtonBluRaySteelbookFnacExclusiveOpenEditionDetails() {
  return (
    <div className="bg-[#1f242a] relative rounded-[12px] shrink-0 w-full" data-name="Button - Blu-ray Steelbook — FNAC Exclusive. Open edition details.">
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center p-[13px] relative size-full">
          <Container26 />
          <Container27 />
          <Container30 />
        </div>
      </div>
    </div>
  );
}

function Image4KUhdDigibookUsStandardPackaging() {
  return (
    <div className="h-[84px] relative shrink-0 w-full" data-name="Image (4K UHD Digibook — US Standard packaging)">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage} />
    </div>
  );
}

function Container31() {
  return (
    <div className="h-[84px] relative rounded-[8px] shrink-0 w-[56px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <Image4KUhdDigibookUsStandardPackaging />
      </div>
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="h-[22.5px] relative shrink-0 w-[1128px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[22.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[15px] whitespace-nowrap">4K UHD Digibook — US Standard</p>
      </div>
    </div>
  );
}

function Text49() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[8px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">Digibook</p>
      </div>
    </div>
  );
}

function Text50() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[8px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">Region A</p>
      </div>
    </div>
  );
}

function Text51() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[8px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">USA</p>
      </div>
    </div>
  );
}

function Text52() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">2024</p>
      </div>
    </div>
  );
}

function Container33() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <Text49 />
        <Text50 />
        <Text51 />
        <Text52 />
      </div>
    </div>
  );
}

function Icon19() {
  return (
    <div className="relative shrink-0 size-[11px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="11" preserveAspectRatio="none" viewBox="0 0 11 11" width="11">
        <g clipPath="url(#clip0_22_1073)" id="Icon">
          <path d="M6.875 1.375H9.625V4.125" id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
          <path d="M4.58333 6.41667L9.625 1.375" id="Vector_2" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
          <path d={svgPaths.p2c2ae900} id="Vector_3" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
        </g>
        <defs>
          <clipPath id="clip0_22_1073">
            <rect fill="white" height="11" width="11" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text54() {
  return (
    <div className="absolute content-stretch flex gap-[2px] items-center left-[58.1px] top-[1.25px]" data-name="Text">
      <Icon19 />
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">eBay</p>
    </div>
  );
}

function Text53() {
  return (
    <div className="h-[22.5px] relative shrink-0 w-[172.797px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="[word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[22.5px] left-0 not-italic text-[#e8e8e8] text-[15px] top-0 whitespace-nowrap">$29.99</p>
        <Text54 />
        <p className="[word-break:break-word] absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[107.61px] not-italic text-[#8a8f98] text-[11px] top-[4.5px] whitespace-nowrap">· affiliate link</p>
      </div>
    </div>
  );
}

function Text58() {
  return (
    <div className="absolute bg-[#3a4450] content-stretch flex items-center justify-center left-0 rounded-[16777200px] size-[20px] top-[3.75px]" data-name="Text">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[11px] whitespace-nowrap">TV</p>
    </div>
  );
}

function Text57() {
  return (
    <div className="bg-[rgba(255,255,255,0)] h-[24px] relative rounded-[9999px] shadow-[0px_0px_0px_0px_#1f242a] shrink-0 w-[20px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text58 />
      </div>
    </div>
  );
}

function Text60() {
  return (
    <div className="absolute bg-[#4a3d3d] content-stretch flex items-center justify-center left-0 rounded-[16777200px] size-[20px] top-[3.75px]" data-name="Text">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[11px] whitespace-nowrap">MH</p>
    </div>
  );
}

function Text59() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] h-[24px] left-[-8px] rounded-[9999px] shadow-[0px_0px_0px_0px_#1f242a] top-0 w-[20px]" data-name="Text">
      <Text60 />
    </div>
  );
}

function TextMargin3() {
  return (
    <div className="h-[24px] relative shrink-0 w-[12px]" data-name="Text:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Text59 />
      </div>
    </div>
  );
}

function Text62() {
  return (
    <div className="absolute bg-[#4a3d3d] content-stretch flex items-center justify-center left-0 rounded-[16777200px] size-[20px] top-[3.75px]" data-name="Text">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[11px] whitespace-nowrap">AD</p>
    </div>
  );
}

function Text61() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] h-[24px] left-[-8px] rounded-[9999px] shadow-[0px_0px_0px_0px_#1f242a] top-0 w-[20px]" data-name="Text">
      <Text62 />
    </div>
  );
}

function TextMargin4() {
  return (
    <div className="h-[24px] relative shrink-0 w-[12px]" data-name="Text:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Text61 />
      </div>
    </div>
  );
}

function Text56() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <Text57 />
        <TextMargin3 />
        <TextMargin4 />
      </div>
    </div>
  );
}

function Text63() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">356 own this</p>
      </div>
    </div>
  );
}

function Text55() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <Text56 />
        <Text63 />
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Text53 />
        <Text55 />
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div className="flex-[1128_0_0] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6px] items-start relative size-full">
        <Paragraph5 />
        <Container33 />
        <Container34 />
      </div>
    </div>
  );
}

function Icon20() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d="M3.33333 8H12.6667" id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 3.33333V12.6667" id="Vector_2" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToCollection3() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0 size-[36px]" data-name="Button - Add to collection">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon20 />
      </div>
    </div>
  );
}

function Icon21() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d={svgPaths.p13f2e300} id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToWishlist3() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0 size-[36px]" data-name="Button - Add to wishlist">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon21 />
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <ButtonAddToCollection3 />
        <ButtonAddToWishlist3 />
      </div>
    </div>
  );
}

function Button4KUhdDigibookUsStandardOpenEditionDetails() {
  return (
    <div className="bg-[#1f242a] relative rounded-[12px] shrink-0 w-full" data-name="Button - 4K UHD Digibook — US Standard. Open edition details.">
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center p-[13px] relative size-full">
          <Container31 />
          <Container32 />
          <Container35 />
        </div>
      </div>
    </div>
  );
}

function Image4KUhdSteelbookZavviExclusivePackaging() {
  return (
    <div className="h-[84px] relative shrink-0 w-full" data-name="Image (4K UHD Steelbook — Zavvi Exclusive packaging)">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImageNeonRequiemCoverArt} />
    </div>
  );
}

function Container36() {
  return (
    <div className="h-[84px] relative rounded-[8px] shrink-0 w-[56px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <Image4KUhdSteelbookZavviExclusivePackaging />
      </div>
    </div>
  );
}

function Paragraph6() {
  return (
    <div className="h-[22.5px] relative shrink-0 w-[1128px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[22.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[15px] whitespace-nowrap">4K UHD Steelbook — Zavvi Exclusive</p>
      </div>
    </div>
  );
}

function Text64() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[8px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">Steelbook</p>
      </div>
    </div>
  );
}

function Text65() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[8px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">Region Free</p>
      </div>
    </div>
  );
}

function Text66() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[8px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">UK</p>
      </div>
    </div>
  );
}

function Text67() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">2024</p>
      </div>
    </div>
  );
}

function Container38() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <Text64 />
        <Text65 />
        <Text66 />
        <Text67 />
      </div>
    </div>
  );
}

function Icon22() {
  return (
    <div className="relative shrink-0 size-[11px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="11" preserveAspectRatio="none" viewBox="0 0 11 11" width="11">
        <g clipPath="url(#clip0_22_1073)" id="Icon">
          <path d="M6.875 1.375H9.625V4.125" id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
          <path d="M4.58333 6.41667L9.625 1.375" id="Vector_2" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
          <path d={svgPaths.p2c2ae900} id="Vector_3" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
        </g>
        <defs>
          <clipPath id="clip0_22_1073">
            <rect fill="white" height="11" width="11" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text69() {
  return (
    <div className="absolute content-stretch flex gap-[2px] items-center left-[58.6px] top-[1.25px]" data-name="Text">
      <Icon22 />
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">eBay</p>
    </div>
  );
}

function Text68() {
  return (
    <div className="h-[22.5px] relative shrink-0 w-[173.297px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="[word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[22.5px] left-0 not-italic text-[#e8e8e8] text-[15px] top-0 whitespace-nowrap">$34.99</p>
        <Text69 />
        <p className="[word-break:break-word] absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[108.11px] not-italic text-[#8a8f98] text-[11px] top-[4.5px] whitespace-nowrap">· affiliate link</p>
      </div>
    </div>
  );
}

function Text73() {
  return (
    <div className="absolute bg-[#4a3d3d] content-stretch flex items-center justify-center left-0 rounded-[16777200px] size-[20px] top-[3.75px]" data-name="Text">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[11px] whitespace-nowrap">MH</p>
    </div>
  );
}

function Text72() {
  return (
    <div className="bg-[rgba(255,255,255,0)] h-[24px] relative rounded-[9999px] shadow-[0px_0px_0px_0px_#1f242a] shrink-0 w-[20px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text73 />
      </div>
    </div>
  );
}

function Text75() {
  return (
    <div className="absolute bg-[#3d4a45] content-stretch flex items-center justify-center left-0 rounded-[16777200px] size-[20px] top-[3.75px]" data-name="Text">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[11px] whitespace-nowrap">PR</p>
    </div>
  );
}

function Text74() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] h-[24px] left-[-8px] rounded-[9999px] shadow-[0px_0px_0px_0px_#1f242a] top-0 w-[20px]" data-name="Text">
      <Text75 />
    </div>
  );
}

function TextMargin5() {
  return (
    <div className="h-[24px] relative shrink-0 w-[12px]" data-name="Text:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Text74 />
      </div>
    </div>
  );
}

function Text77() {
  return (
    <div className="absolute bg-[#3d4a45] content-stretch flex items-center justify-center left-0 rounded-[16777200px] size-[20px] top-[3.75px]" data-name="Text">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[11px] whitespace-nowrap">DO</p>
    </div>
  );
}

function Text76() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] h-[24px] left-[-8px] rounded-[9999px] shadow-[0px_0px_0px_0px_#1f242a] top-0 w-[20px]" data-name="Text">
      <Text77 />
    </div>
  );
}

function TextMargin6() {
  return (
    <div className="h-[24px] relative shrink-0 w-[12px]" data-name="Text:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Text76 />
      </div>
    </div>
  );
}

function Text71() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <Text72 />
        <TextMargin5 />
        <TextMargin6 />
      </div>
    </div>
  );
}

function Text78() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">428 own this</p>
      </div>
    </div>
  );
}

function Text70() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <Text71 />
        <Text78 />
      </div>
    </div>
  );
}

function Container39() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Text68 />
        <Text70 />
      </div>
    </div>
  );
}

function Container37() {
  return (
    <div className="flex-[1128_0_0] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6px] items-start relative size-full">
        <Paragraph6 />
        <Container38 />
        <Container39 />
      </div>
    </div>
  );
}

function Icon23() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d="M3.33333 8H12.6667" id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 3.33333V12.6667" id="Vector_2" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToCollection4() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0 size-[36px]" data-name="Button - Add to collection">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon23 />
      </div>
    </div>
  );
}

function Icon24() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d={svgPaths.p13f2e300} id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToWishlist4() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0 size-[36px]" data-name="Button - Add to wishlist">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon24 />
      </div>
    </div>
  );
}

function Container40() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <ButtonAddToCollection4 />
        <ButtonAddToWishlist4 />
      </div>
    </div>
  );
}

function Button4KUhdSteelbookZavviExclusiveOpenEditionDetails() {
  return (
    <div className="bg-[#1f242a] relative rounded-[12px] shrink-0 w-full" data-name="Button - 4K UHD Steelbook — Zavvi Exclusive. Open edition details.">
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center p-[13px] relative size-full">
          <Container36 />
          <Container37 />
          <Container40 />
        </div>
      </div>
    </div>
  );
}

function Image4KUhdCollectorsBoxSetPackaging() {
  return (
    <div className="h-[84px] relative shrink-0 w-full" data-name="Image (4K UHD Collector's Box Set packaging)">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage4KUhdCollectorsBoxSetPackaging} />
    </div>
  );
}

function Container41() {
  return (
    <div className="h-[84px] relative rounded-[8px] shrink-0 w-[56px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <Image4KUhdCollectorsBoxSetPackaging />
      </div>
    </div>
  );
}

function Paragraph7() {
  return (
    <div className="h-[22.5px] relative shrink-0 w-[1128px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[22.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[15px] whitespace-nowrap">{`4K UHD Collector's Box Set`}</p>
      </div>
    </div>
  );
}

function Text79() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[8px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">Box Set</p>
      </div>
    </div>
  );
}

function Text80() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[8px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">Region Free</p>
      </div>
    </div>
  );
}

function Text81() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[8px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">UK</p>
      </div>
    </div>
  );
}

function Text82() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">2025</p>
      </div>
    </div>
  );
}

function Container43() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <Text79 />
        <Text80 />
        <Text81 />
        <Text82 />
      </div>
    </div>
  );
}

function Icon25() {
  return (
    <div className="relative shrink-0 size-[11px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="11" preserveAspectRatio="none" viewBox="0 0 11 11" width="11">
        <g clipPath="url(#clip0_22_1073)" id="Icon">
          <path d="M6.875 1.375H9.625V4.125" id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
          <path d="M4.58333 6.41667L9.625 1.375" id="Vector_2" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
          <path d={svgPaths.p2c2ae900} id="Vector_3" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
        </g>
        <defs>
          <clipPath id="clip0_22_1073">
            <rect fill="white" height="11" width="11" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text84() {
  return (
    <div className="absolute content-stretch flex gap-[2px] items-center left-[58.36px] top-[1.25px]" data-name="Text">
      <Icon25 />
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">eBay</p>
    </div>
  );
}

function Text83() {
  return (
    <div className="h-[22.5px] relative shrink-0 w-[173.055px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="[word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[22.5px] left-0 not-italic text-[#e8e8e8] text-[15px] top-0 whitespace-nowrap">$89.99</p>
        <Text84 />
        <p className="[word-break:break-word] absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[107.87px] not-italic text-[#8a8f98] text-[11px] top-[4.5px] whitespace-nowrap">· affiliate link</p>
      </div>
    </div>
  );
}

function Text88() {
  return (
    <div className="absolute bg-[#4a3d3d] content-stretch flex items-center justify-center left-0 rounded-[16777200px] size-[20px] top-[3.75px]" data-name="Text">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[11px] whitespace-nowrap">MH</p>
    </div>
  );
}

function Text87() {
  return (
    <div className="bg-[rgba(255,255,255,0)] h-[24px] relative rounded-[9999px] shadow-[0px_0px_0px_0px_#1f242a] shrink-0 w-[20px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text88 />
      </div>
    </div>
  );
}

function Text90() {
  return (
    <div className="absolute bg-[#3d4a45] content-stretch flex items-center justify-center left-0 rounded-[16777200px] size-[20px] top-[3.75px]" data-name="Text">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16.5px] not-italic relative shrink-0 text-[#e8e8e8] text-[11px] whitespace-nowrap">DO</p>
    </div>
  );
}

function Text89() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] h-[24px] left-[-8px] rounded-[9999px] shadow-[0px_0px_0px_0px_#1f242a] top-0 w-[20px]" data-name="Text">
      <Text90 />
    </div>
  );
}

function TextMargin7() {
  return (
    <div className="h-[24px] relative shrink-0 w-[12px]" data-name="Text:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Text89 />
      </div>
    </div>
  );
}

function Text86() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <Text87 />
        <TextMargin7 />
      </div>
    </div>
  );
}

function Text91() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#8a8f98] text-[13px] whitespace-nowrap">143 own this</p>
      </div>
    </div>
  );
}

function Text85() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <Text86 />
        <Text91 />
      </div>
    </div>
  );
}

function Container44() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Text83 />
        <Text85 />
      </div>
    </div>
  );
}

function Container42() {
  return (
    <div className="flex-[1128_0_0] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6px] items-start relative size-full">
        <Paragraph7 />
        <Container43 />
        <Container44 />
      </div>
    </div>
  );
}

function Icon26() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d="M3.33333 8H12.6667" id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 3.33333V12.6667" id="Vector_2" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToCollection5() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0 size-[36px]" data-name="Button - Add to collection">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon26 />
      </div>
    </div>
  );
}

function Icon27() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d={svgPaths.p13f2e300} id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToWishlist5() {
  return (
    <div className="bg-[#262c33] relative rounded-[16777200px] shrink-0 size-[36px]" data-name="Button - Add to wishlist">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon27 />
      </div>
    </div>
  );
}

function Container45() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
        <ButtonAddToCollection5 />
        <ButtonAddToWishlist5 />
      </div>
    </div>
  );
}

function Button4KUhdCollectorsBoxSetOpenEditionDetails() {
  return (
    <div className="bg-[#1f242a] relative rounded-[12px] shrink-0 w-full" data-name="Button - 4K UHD Collector's Box Set. Open edition details.">
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center p-[13px] relative size-full">
          <Container41 />
          <Container42 />
          <Container45 />
        </div>
      </div>
    </div>
  );
}

function List() {
  return (
    <div className="h-[730px] relative shrink-0 w-[1312px]" data-name="List">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[10px] items-start pt-[20px] relative size-full">
        <ButtonDvdStandardReleaseOpenEditionDetails />
        <ButtonBluRayStandardEditionOpenEditionDetails />
        <ButtonBluRaySteelbookFnacExclusiveOpenEditionDetails />
        <Button4KUhdDigibookUsStandardOpenEditionDetails />
        <Button4KUhdSteelbookZavviExclusiveOpenEditionDetails />
        <Button4KUhdCollectorsBoxSetOpenEditionDetails />
      </div>
    </div>
  );
}

function SectionEditions() {
  return (
    <div className="content-stretch flex flex-col h-[861px] items-start max-w-[1440px] px-[64px] py-[24px] relative shrink-0 w-[1440px]" data-name="Section - Editions">
      <Container14 />
      <List />
    </div>
  );
}

function ContainerMargin1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative size-full">
        <SectionEditions />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="bg-[#14181c] min-h-[1203px] relative shrink-0 w-[1596px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start min-h-[inherit] pb-[40px] relative size-full">
        <Container1 />
        <Container13 />
        <ContainerMargin1 />
      </div>
    </div>
  );
}

function Body() {
  return (
    <div className="h-[1203px] relative shrink-0 w-[1596px]" data-name="Body">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Container />
      </div>
    </div>
  );
}

function Icon28() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="18" preserveAspectRatio="none" viewBox="0 0 18 18" width="18">
        <g id="Icon">
          <path d={svgPaths.p1a8e7980} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.65" />
          <path d="M5.25 2.25V15.75" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.65" />
          <path d="M2.25 5.625H5.25" id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.65" />
          <path d="M2.25 9H15.75" id="Vector_4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.65" />
          <path d="M2.25 12.375H5.25" id="Vector_5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.65" />
          <path d="M12.75 2.25V15.75" id="Vector_6" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.65" />
          <path d="M12.75 5.625H15.75" id="Vector_7" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.65" />
          <path d="M12.75 12.375H15.75" id="Vector_8" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.65" />
        </g>
      </svg>
    </div>
  );
}

function Text92() {
  return (
    <div className="bg-[#2e7dff] relative rounded-[8px] shrink-0 size-[32px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon28 />
      </div>
    </div>
  );
}

function Text93() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Bold',sans-serif] font-bold leading-[27px] not-italic relative shrink-0 text-[#e8e8e8] text-[18px] whitespace-nowrap">Reelio</p>
      </div>
    </div>
  );
}

function Link() {
  return (
    <div className="relative shrink-0" data-name="Link">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Text92 />
        <Text93 />
      </div>
    </div>
  );
}

function Icon29() {
  return (
    <div className="absolute left-[12px] size-[16px] top-[11.5px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d={svgPaths.p107a080} id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M14 14L11.1333 11.1333" id="Vector_2" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function SearchInput() {
  return (
    <div className="absolute bg-[#1f242a] h-[39px] left-0 rounded-[16777200px] top-0 w-[520px]" data-name="Search Input">
      <div className="content-stretch flex flex-col items-start justify-center overflow-clip pl-[37px] pr-[17px] py-[9px] relative rounded-[inherit] size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[14px] text-[rgba(232,232,232,0.5)] w-full">Search movies, editions, or users</p>
      </div>
      <div aria-hidden className="absolute border border-[#2a3138] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
    </div>
  );
}

function Label3() {
  return (
    <div className="h-[39px] max-w-[520px] relative shrink-0 w-[520px]" data-name="Label">
      <Icon29 />
      <SearchInput />
    </div>
  );
}

function ContainerAlign2() {
  return (
    <div className="flex-[520_0_0] min-w-px relative" data-name="Container:align">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start justify-center relative size-full">
        <Label3 />
      </div>
    </div>
  );
}

function Icon30() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 20 20" width="20">
        <g id="Icon">
          <path d={svgPaths.p1c3efea0} id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p25877f40} id="Vector_2" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Text94() {
  return <div className="absolute bg-[#2e7dff] left-[24px] rounded-[16777200px] shadow-[0px_0px_0px_0px_#14181c] size-[8px] top-[8px]" data-name="Text" />;
}

function ButtonNotifications() {
  return (
    <div className="relative rounded-[16777200px] shrink-0 size-[40px]" data-name="Button - Notifications">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon30 />
        <Text94 />
      </div>
    </div>
  );
}

function Icon31() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 20 20" width="20">
        <g id="Icon">
          <path d={svgPaths.p383b2000} id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Text95() {
  return <div className="absolute bg-[#2e7dff] left-[24px] rounded-[16777200px] shadow-[0px_0px_0px_0px_#14181c] size-[8px] top-[8px]" data-name="Text" />;
}

function ButtonMessages() {
  return (
    <div className="relative rounded-[16777200px] shrink-0 size-[40px]" data-name="Button - Messages">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Icon31 />
        <Text95 />
      </div>
    </div>
  );
}

function Text96() {
  return (
    <div className="bg-[#4a3d3d] relative rounded-[16777200px] shrink-0 size-[34px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[19.38px] not-italic relative shrink-0 text-[#e8e8e8] text-[12.92px] text-center whitespace-nowrap">AD</p>
      </div>
    </div>
  );
}

function Icon32() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Icon">
          <path d="M4 6L8 10L12 6" id="Vector" stroke="var(--stroke-0, #8A8F98)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAccountMenu() {
  return (
    <div className="relative rounded-[16777200px] shrink-0" data-name="Button - Account menu">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center p-[2px] relative size-full">
        <Text96 />
        <Icon32 />
      </div>
    </div>
  );
}

function Container47() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <ButtonNotifications />
        <ButtonMessages />
        <ButtonAccountMenu />
      </div>
    </div>
  );
}

function Container46() {
  return (
    <div className="content-stretch flex gap-[16px] items-center max-w-[1440px] px-[64px] relative shrink-0 w-[1440px]" data-name="Container">
      <Link />
      <ContainerAlign2 />
      <Container47 />
    </div>
  );
}

function ContainerAlign1() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="Container:align">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start justify-center relative size-full">
        <Container46 />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="absolute bg-[#14181c] h-[72px] left-0 top-0 w-[1596px]" data-name="Header">
      <div aria-hidden className="absolute border-[#2a3138] border-b border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center pb-px relative size-full">
        <ContainerAlign1 />
      </div>
    </div>
  );
}

export default function DesignLoggedInDashboard() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative size-full" data-name="Design logged-in dashboard">
      <Body />
      <Header />
    </div>
  );
}