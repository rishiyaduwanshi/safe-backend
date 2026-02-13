export type Severity = "low" | "medium" | "high" | "critical";

export interface Category {
  id: number;
  key: string;
  label: string;
  description: {
    eng: string;
    hin: string;
    hing: string;
  };
  severity: Severity;
}

export interface CategoryGroup {
  type: "hazard" | "violation";
  items: readonly Category[];
}

export interface FlatCategory extends Category {
  type: "hazard" | "violation";
}


export const categories: readonly CategoryGroup[] = [
  {
    type: "hazard",
    items: [
      {
        id: 100,
        key: "pothole",
        label: "Pothole",
        description: {
          eng: "A deep hole formed on the road surface that can damage vehicles and cause accidents.",
          hin: "सड़क पर बना गहरा गड्ढा जो वाहनों को नुकसान पहुंचा सकता है और दुर्घटना का कारण बन सकता है।",
          hing: "Road par bana gehra gadda jo vehicle ko damage kar sakta hai aur accident ka risk badha sakta hai."
        },
        severity: "medium"
      },
      {
        id: 150,
        key: "road_crack",
        label: "Broken / Cracked Road",
        description: {
          eng: "Damaged or cracked portion of the road surface making driving unsafe.",
          hin: "सड़क का टूटा या फटा हुआ हिस्सा जिससे वाहन चलाना असुरक्षित हो जाता है।",
          hing: "Road ka toota ya cracked hissa jisse driving unsafe ho jati hai."
        },
        severity: "medium"
      },
      {
        id: 200,
        key: "water_logging",
        label: "Water Logging",
        description: {
          eng: "Accumulation of water on the road reducing visibility and increasing accident risk.",
          hin: "सड़क पर पानी भर जाना जिससे दृश्यता कम हो जाती है और दुर्घटना का खतरा बढ़ता है।",
          hing: "Road par paani jama ho jana jisse visibility kam ho jati hai aur accident ka risk badhta hai."
        },
        severity: "high"
      },
      {
        id: 250,
        key: "fallen_tree",
        label: "Fallen Tree",
        description: {
          eng: "A tree fallen onto the road blocking traffic and creating serious danger.",
          hin: "सड़क पर गिरा हुआ पेड़ जो ट्रैफिक को रोक देता है और गंभीर खतरा पैदा करता है।",
          hing: "Road par gira hua ped jo traffic block kar deta hai aur serious danger create karta hai."
        },
        severity: "critical"
      },
      {
        id: 300,
        key: "road_block",
        label: "Road Block",
        description: {
          eng: "Any major obstruction completely blocking vehicle movement.",
          hin: "कोई बड़ी रुकावट जो वाहनों की आवाजाही पूरी तरह रोक दे।",
          hing: "Koi badi rukawat jo vehicles ko completely block kar de."
        },
        severity: "high"
      },
      {
        id: 350,
        key: "road_debris",
        label: "Road Debris",
        description: {
          eng: "Garbage, stones, broken parts, or unwanted materials lying on the road.",
          hin: "सड़क पर पड़ा कचरा, पत्थर या टूटे हुए वाहन के हिस्से।",
          hing: "Road par pada kachra, patthar ya vehicle ke toote parts."
        },
        severity: "medium"
      },
      {
        id: 400,
        key: "open_manhole",
        label: "Open Manhole",
        description: {
          eng: "A manhole without a cover posing immediate life-threatening danger.",
          hin: "बिना ढक्कन का मैनहोल जो जानलेवा खतरा बन सकता है।",
          hing: "Bina dhakkan ka manhole jo turant jaanleva ho sakta hai."
        },
        severity: "critical"
      },
      {
        id: 450,
        key: "streetlight_not_working",
        label: "Streetlight Not Working",
        description: {
          eng: "Streetlight not functioning at night causing low visibility.",
          hin: "रात में स्ट्रीटलाइट का काम न करना जिससे दृश्यता कम हो जाती है।",
          hing: "Raat me streetlight ka kaam na karna jisse visibility kam ho jati hai."
        },
        severity: "low"
      },
      {
        id: 500,
        key: "damaged_signal",
        label: "Damaged Traffic Signal",
        description: {
          eng: "Traffic signal not working properly causing confusion and risk.",
          hin: "ट्रैफिक सिग्नल का सही से काम न करना जिससे दुर्घटना का खतरा बढ़ता है।",
          hing: "Traffic signal ka kaam na karna jisse accident ka risk badhta hai."
        },
        severity: "high"
      }
    ]
  },
  {
    type: "violation",
    items: [
      {
        id: 1001,
        key: "no_helmet",
        label: "No Helmet",
        description: {
          eng: "Riding a two-wheeler without wearing a helmet.",
          hin: "बिना हेलमेट दोपहिया वाहन चलाना।",
          hing: "Helmet bina two-wheeler chalana."
        },
        severity: "medium"
      },
      {
        id: 1050,
        key: "overspeeding",
        label: "Overspeeding",
        description: {
          eng: "Driving above the legally allowed speed limit.",
          hin: "निर्धारित गति सीमा से अधिक तेज वाहन चलाना।",
          hing: "Speed limit se zyada fast gaadi chalana."
        },
        severity: "high"
      },
      {
        id: 1100,
        key: "wrong_side_driving",
        label: "Wrong Side Driving",
        description: {
          eng: "Driving against the flow of traffic.",
          hin: "ट्रैफिक की दिशा के विपरीत वाहन चलाना।",
          hing: "Traffic ke opposite direction me gaadi chalana."
        },
        severity: "critical"
      },
      {
        id: 1200,
        key: "drunk_driving",
        label: "Drunk Driving",
        description: {
          eng: "Driving under the influence of alcohol or drugs.",
          hin: "शराब या नशे के प्रभाव में वाहन चलाना।",
          hing: "Sharab ya drugs ke effect me gaadi chalana."
        },
        severity: "critical"
      },
      {
        id: 1300,
        key: "illegal_parking",
        label: "Illegal Parking",
        description: {
          eng: "Parking a vehicle in a no-parking zone or blocking traffic.",
          hin: "नो-पार्किंग क्षेत्र में वाहन खड़ा करना।",
          hing: "No-parking zone me gaadi khadi karna."
        },
        severity: "medium"
      }
    ]
  }
] as const;


export const flatCategory: readonly FlatCategory[] = categories.flatMap(
  (group) =>
    group.items.map((item) => ({
      ...item,
      type: group.type
    }))
);
