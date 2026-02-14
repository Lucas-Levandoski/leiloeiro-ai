import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, DollarSign, Save, Loader2, RefreshCw, Settings2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface FinancialCalculatorProps {
  details: any;
  auctionPrices: any[];
  onSave: (updatedDetails: any) => Promise<void>;
}

export function FinancialCalculator({ details, auctionPrices, onSave }: FinancialCalculatorProps) {
  const [loading, setLoading] = useState(false);
  
  // State for inputs
  const [formData, setFormData] = useState({
    divida_iptu: 0,
    divida_condominio: 0,
    percentual_entrada: 25, // Default usually 25%
    numero_maximo_parcelas: 30, // Default usually 30
    valor_mercado: 0,
    custo_manutencao: 0,
    valor_lance: 0,
    taxa_imposto_rate: 3, // 3% default
    taxa_transferencia_rate: 2, // 2% default
    taxa_leiloeiro_rate: 5, // 5% default
    taxa_imobiliaria_rate: 6 // 6% default
  });

  // Helper to parse currency string to number
  const parseCurrency = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Remove non-numeric characters except comma and dot
    const cleanValue = value.replace(/[^\d,.-]/g, '');
    // Replace comma with dot for parsing if standard PT-BR format
    const normalizedValue = cleanValue.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalizedValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper to find best initial price
  const getInitialPrice = () => {
    if (!auctionPrices || auctionPrices.length === 0) return 0;
    
    // Try to find "2º Leilão" or lowest value
    const secondAuction = auctionPrices.find(p => p.label?.toLowerCase().includes('2º') || p.label?.toLowerCase().includes('segundo'));
    if (secondAuction) return parseCurrency(secondAuction.value);

    // Fallback to first price
    return parseCurrency(auctionPrices[0].value);
  };

  // Initialize state from details
  useEffect(() => {
    if (details) {
      setFormData(prev => ({
        ...prev,
        divida_iptu: details.financial_divida_iptu ? Number(details.financial_divida_iptu) : 0,
        divida_condominio: details.financial_divida_condominio ? Number(details.financial_divida_condominio) : 0,
        percentual_entrada: details.financial_percentual_entrada ? Number(details.financial_percentual_entrada) : (details.percentual_entrada ? Number(details.percentual_entrada) : 25),
        numero_maximo_parcelas: details.financial_max_parcelas ? Number(details.financial_max_parcelas) : (details.numero_maximo_parcelas ? Number(details.numero_maximo_parcelas) : 30),
        valor_mercado: details.financial_valor_mercado ? Number(details.financial_valor_mercado) : 0,
        custo_manutencao: details.financial_custo_manutencao ? Number(details.financial_custo_manutencao) : 0,
        valor_lance: details.financial_valor_lance ? Number(details.financial_valor_lance) : getInitialPrice(),
        // Load custom rates if saved, otherwise defaults
        taxa_leiloeiro_rate: details.financial_taxa_leiloeiro_rate ? Number(details.financial_taxa_leiloeiro_rate) : 6,
        taxa_imobiliaria_rate: details.financial_taxa_imobiliaria_rate ? Number(details.financial_taxa_imobiliaria_rate) : 8,
        taxa_transferencia_rate: details.financial_taxa_transferencia_rate ? Number(details.financial_taxa_transferencia_rate) : 2,
        taxa_imposto_rate: details.financial_taxa_imposto_rate ? Number(details.financial_taxa_imposto_rate) : 3,
      }));
    }
  }, [details, auctionPrices]);

  const handleInputChange = (field: string, value: string | number) => {
    let parsedValue = 0;
    if (typeof value === 'number') {
        parsedValue = value;
    } else {
        parsedValue = parseFloat(value) || 0;
    }

    setFormData(prev => ({
      ...prev,
      [field]: parsedValue
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedDetails = {
        ...details,
        financial_divida_iptu: formData.divida_iptu,
        financial_divida_condominio: formData.divida_condominio,
        financial_percentual_entrada: formData.percentual_entrada,
        financial_max_parcelas: formData.numero_maximo_parcelas,
        financial_valor_mercado: formData.valor_mercado,
        financial_custo_manutencao: formData.custo_manutencao,
        financial_valor_lance: formData.valor_lance,
        // Save rates too
        financial_taxa_leiloeiro_rate: formData.taxa_leiloeiro_rate,
        financial_taxa_imobiliaria_rate: formData.taxa_imobiliaria_rate,
        financial_taxa_transferencia_rate: formData.taxa_transferencia_rate,
        financial_taxa_imposto_rate: formData.taxa_imposto_rate,
      };
      await onSave(updatedDetails);
      toast.success("Informações financeiras salvas!");
    } catch (error) {
      toast.error("Erro ao salvar informações");
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const valorEntrada = formData.valor_lance * (formData.percentual_entrada / 100);
  const taxaLeiloeiro = formData.valor_lance * (formData.taxa_leiloeiro_rate / 100);
  const taxaImobiliaria = formData.valor_mercado * (formData.taxa_imobiliaria_rate / 100);
  const taxaTransferencia = formData.valor_lance * (formData.taxa_transferencia_rate / 100); // Usually on transaction value
  const imposto = formData.valor_lance * (formData.taxa_imposto_rate / 100); // ITBI ~3%

  const totalCustosExtras = 
    formData.divida_iptu + 
    formData.divida_condominio + 
    formData.custo_manutencao + 
    taxaLeiloeiro + 
    taxaImobiliaria + 
    taxaTransferencia + 
    imposto;

  const custoTotal = formData.valor_lance + totalCustosExtras;
  const lucroPotencial = formData.valor_mercado - custoTotal;
  const roi = custoTotal > 0 ? (lucroPotencial / custoTotal) * 100 : 0;

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
            <Calculator className="h-5 w-5" />
            Simulador Financeiro
          </CardTitle>
          <div className="flex items-center gap-2">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 border-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 dark:border-emerald-800">
                        <Settings2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                    </Button>
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Configurar Taxas</SheetTitle>
                        <SheetDescription>
                            Ajuste as taxas utilizadas nos cálculos financeiros.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="taxa_imposto">Taxa Imposto (ITBI)</Label>
                            <div className="relative">
                                <Input 
                                    id="taxa_imposto" 
                                    type="number" 
                                    value={formData.taxa_imposto_rate}
                                    onChange={(e) => handleInputChange('taxa_imposto_rate', e.target.value)}
                                    className="pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="taxa_leiloeiro">Taxa Leiloeiro</Label>
                            <div className="relative">
                                <Input 
                                    id="taxa_leiloeiro" 
                                    type="number" 
                                    value={formData.taxa_leiloeiro_rate}
                                    onChange={(e) => handleInputChange('taxa_leiloeiro_rate', e.target.value)}
                                    className="pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="taxa_imobiliaria">Comissão Imobiliária</Label>
                            <div className="relative">
                                <Input 
                                    id="taxa_imobiliaria" 
                                    type="number" 
                                    value={formData.taxa_imobiliaria_rate}
                                    onChange={(e) => handleInputChange('taxa_imobiliaria_rate', e.target.value)}
                                    className="pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="taxa_transferencia">Taxa Transferência/Cartório</Label>
                            <div className="relative">
                                <Input 
                                    id="taxa_transferencia" 
                                    type="number" 
                                    value={formData.taxa_transferencia_rate}
                                    onChange={(e) => handleInputChange('taxa_transferencia_rate', e.target.value)}
                                    className="pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
            <Button 
                onClick={handleSave} 
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Simulação
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* User Inputs Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Variáveis do Investidor
                </h4>
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="valor_lance">Valor do Lance (Simulado)</Label>
                        <CurrencyInput 
                            id="valor_lance" 
                            value={formData.valor_lance}
                            onChange={(val) => handleInputChange('valor_lance', val)}
                            className="bg-white dark:bg-slate-950 border-emerald-200"
                        />
                    </div>
                    <div>
                        <Label htmlFor="valor_mercado">Valor de Mercado (Venda)</Label>
                        <CurrencyInput 
                            id="valor_mercado" 
                            value={formData.valor_mercado}
                            onChange={(val) => handleInputChange('valor_mercado', val)}
                            className="bg-white dark:bg-slate-950 border-emerald-200"
                        />
                    </div>
                    <div>
                        <Label htmlFor="custo_manutencao">Custo de Manutenção/Reforma</Label>
                        <CurrencyInput 
                            id="custo_manutencao" 
                            value={formData.custo_manutencao}
                            onChange={(val) => handleInputChange('custo_manutencao', val)}
                            className="bg-white dark:bg-slate-950 border-emerald-200"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" /> Dados do Edital
                </h4>
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="divida_iptu">Dívida IPTU</Label>
                        <CurrencyInput 
                            id="divida_iptu" 
                            value={formData.divida_iptu}
                            onChange={(val) => handleInputChange('divida_iptu', val)}
                            className="bg-white dark:bg-slate-950 border-emerald-200"
                        />
                    </div>
                    <div>
                        <Label htmlFor="divida_condominio">Dívida Condomínio</Label>
                        <CurrencyInput 
                            id="divida_condominio" 
                            value={formData.divida_condominio}
                            onChange={(val) => handleInputChange('divida_condominio', val)}
                            className="bg-white dark:bg-slate-950 border-emerald-200"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="percentual_entrada">% Entrada</Label>
                            <div className="relative">
                                <Input 
                                    id="percentual_entrada" 
                                    type="number" 
                                    value={formData.percentual_entrada || ''}
                                    onChange={(e) => handleInputChange('percentual_entrada', e.target.value)}
                                    className="bg-white dark:bg-slate-950 border-emerald-200 pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="numero_maximo_parcelas">Max. Parcelas</Label>
                            <Input 
                                id="numero_maximo_parcelas" 
                                type="number" 
                                value={formData.numero_maximo_parcelas || ''}
                                onChange={(e) => handleInputChange('numero_maximo_parcelas', e.target.value)}
                                className="bg-white dark:bg-slate-950 border-emerald-200"
                            />
                        </div>
                    </div>
                    <div className="pt-2">
                        <div className="text-sm font-medium text-muted-foreground">Valor Entrada (Calc):</div>
                        <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                            {formatBRL(valorEntrada)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                    <Calculator className="h-4 w-4" /> Custos Calculados
                </h4>
                <div className="space-y-2 text-sm bg-white/50 dark:bg-emerald-950/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Imposto (ITBI ~{formData.taxa_imposto_rate}%):</span>
                        <span className="font-medium">{formatBRL(imposto)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Taxa Leiloeiro ({formData.taxa_leiloeiro_rate}%):</span>
                        <span className="font-medium">{formatBRL(taxaLeiloeiro)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Comissão Imobiliária ({formData.taxa_imobiliaria_rate}%):</span>
                        <span className="font-medium">{formatBRL(taxaImobiliaria)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Taxa Transferência ({formData.taxa_transferencia_rate}%):</span>
                        <span className="font-medium">{formatBRL(taxaTransferencia)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center text-base font-semibold text-emerald-900 dark:text-emerald-100">
                        <span>Custo Total:</span>
                        <span>{formatBRL(custoTotal)}</span>
                    </div>
                </div>

                <div className={`p-4 rounded-lg border ${lucroPotencial >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200' : 'bg-red-100 dark:bg-red-900/30 border-red-200'}`}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-emerald-900 dark:text-emerald-100">Lucro Estimado:</span>
                        <span className={`text-xl font-bold ${lucroPotencial >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatBRL(lucroPotencial)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-emerald-800 dark:text-emerald-200">ROI Estimado:</span>
                        <span className={`font-bold ${roi >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                            {roi.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
