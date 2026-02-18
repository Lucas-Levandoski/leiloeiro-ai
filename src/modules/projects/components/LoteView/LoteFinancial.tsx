
import { AccordionItem } from "@/components/ui/accordion";
import { FinancialCalculator } from "@/modules/projects/components/FinancialCalculator";

interface LoteFinancialProps {
    lote: any;
    handleFinancialSave: (data: any) => void;
}

export function LoteFinancial({
    lote,
    handleFinancialSave
}: LoteFinancialProps) {
    return (
        <AccordionItem value="financial" className="border rounded-lg bg-green-50/30 dark:bg-green-900/10 border-green-200 dark:border-green-800 px-4">
            <FinancialCalculator 
                details={lote.details}
                auctionPrices={lote.auction_prices}
                onSave={handleFinancialSave}
            />
        </AccordionItem>
    );
}
