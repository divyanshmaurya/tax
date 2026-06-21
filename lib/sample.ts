/**
 * A fictional sample intake — used to prefill the intake form for demos and to
 * exercise PDF generation. All data here is invented; it is NOT a real client.
 */

import type { Form8843Input } from "@/lib/form8843";

export const SAMPLE_INPUT: Form8843Input = {
  personal: {
    firstName: "Alex",
    middleInitial: "R",
    lastName: "Rivera",
    taxpayerId: "123-45-6789",
    countryOfCitizenship: "Brazil",
    passportCountry: "Brazil",
    passportNumber: "YB1234567",
    addressInCountryOfResidence: "742 Rua das Flores, São Paulo, SP 01000, Brazil",
    addressInUnitedStates: "120 College Ave, Apt 4B, Riverton, NY 10027",
  },
  filingCategory: "student",
  currentVisaType: "F-1",
  mostRecentEntryDate: "2025-08-18",
  currentStatusEndOfYear: "F-1",
  daysPresent: { 2025: 136, 2024: 0, 2023: 0 },
  visaHistory: {
    2019: "None",
    2020: "None",
    2021: "None",
    2022: "None",
    2023: "None",
    2024: "None",
    2025: "F",
  },
  institution: {
    name: "Riverton University, Office of International Students",
    address: "500 University Plaza, Riverton, NY 10027",
    phone: "(212) 555-0140",
  },
  director: {
    name: "Dr. Pat Moreno, Designated School Official",
    address: "500 University Plaza, Riverton, NY 10027",
    phone: "(212) 555-0142",
  },
  appliedForGreenCard: false,
  visaTimeline: [],
  hadIncome: false,
};
