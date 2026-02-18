
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Edit, ExternalLink, Landmark, Loader2, MapPin, Save, X } from "lucide-react";

interface LoteDetailsProps {
    lote: any;
    isEditingDetails: boolean;
    setIsEditingDetails: (value: boolean) => void;
    detailsForm: any;
    setDetailsForm: (value: any) => void;
    isSavingDetails: boolean;
    handleSaveDetails: () => void;
    updateDetail: (field: string, value: string) => void;
}

export function LoteDetails({
    lote,
    isEditingDetails,
    setIsEditingDetails,
    detailsForm,
    setDetailsForm,
    isSavingDetails,
    handleSaveDetails,
    updateDetail
}: LoteDetailsProps) {
    return (
        <AccordionItem value="details" className="border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-500" />
                        <span className="font-semibold text-lg">Detalhes do Imóvel e Localização</span>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                        {!isEditingDetails ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditingDetails(true);
                                }}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditingDetails(false);
                                        setDetailsForm(lote.details || {});
                                    }}
                                    className="h-8 p-2 text-red-600 hover:bg-red-100"
                                >
                                    <X className="h-4 w-4 mr-1" /> Cancelar
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveDetails();
                                    }}
                                    disabled={isSavingDetails}
                                    className="h-8 p-2 text-green-600 hover:bg-green-100"
                                >
                                    {isSavingDetails ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                                    Salvar
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Localização Detalhada
                        </h3>
                        <div className="space-y-2 text-muted-foreground text-sm">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="font-medium text-foreground block">Logradouro:</span> 
                                    {isEditingDetails ? (
                                        <Input 
                                            value={detailsForm.address_street || ""} 
                                            onChange={(e) => updateDetail("address_street", e.target.value)}
                                            className="h-7 text-xs"
                                        />
                                    ) : (lote.details?.address_street || "-")}
                                </div>
                                <div>
                                    <span className="font-medium text-foreground block">Número:</span> 
                                    {isEditingDetails ? (
                                        <Input 
                                            value={detailsForm.address_number || ""} 
                                            onChange={(e) => updateDetail("address_number", e.target.value)}
                                            className="h-7 text-xs"
                                        />
                                    ) : (lote.details?.address_number || "-")}
                                </div>
                            </div>
                            <div>
                                <span className="font-medium text-foreground block">Complemento:</span> 
                                {isEditingDetails ? (
                                    <Input 
                                        value={detailsForm.address_complement || ""} 
                                        onChange={(e) => updateDetail("address_complement", e.target.value)}
                                        className="h-7 text-xs"
                                    />
                                ) : (lote.details?.address_complement || "-")}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="font-medium text-foreground block">Bairro:</span> 
                                    {isEditingDetails ? (
                                        <Input 
                                            value={detailsForm.neighborhood || ""} 
                                            onChange={(e) => updateDetail("neighborhood", e.target.value)}
                                            className="h-7 text-xs"
                                        />
                                    ) : (lote.details?.neighborhood || "-")}
                                </div>
                                <div>
                                    <span className="font-medium text-foreground block">CEP:</span> 
                                    {isEditingDetails ? (
                                        <Input 
                                            value={detailsForm.address_zip || ""} 
                                            onChange={(e) => updateDetail("address_zip", e.target.value)}
                                            className="h-7 text-xs"
                                        />
                                    ) : (lote.details?.address_zip || "-")}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="font-medium text-foreground block">Cidade:</span> 
                                    {isEditingDetails ? (
                                        <Input 
                                            value={detailsForm.city || lote.city || ""} 
                                            onChange={(e) => updateDetail("city", e.target.value)}
                                            className="h-7 text-xs"
                                        />
                                    ) : (lote.city || "-")}
                                </div>
                                <div>
                                    <span className="font-medium text-foreground block">Estado:</span> 
                                    {isEditingDetails ? (
                                        <Input 
                                            value={detailsForm.state || lote.state || ""} 
                                            onChange={(e) => updateDetail("state", e.target.value)}
                                            className="h-7 text-xs"
                                        />
                                    ) : (lote.state || "-")}
                                </div>
                            </div>
                            <div className="pt-2 border-t mt-2">
                                <span className="font-medium text-foreground block mb-1">Endereço Completo:</span> 
                                {isEditingDetails ? (
                                    <Textarea 
                                        value={detailsForm.address || ""} 
                                        onChange={(e) => updateDetail("address", e.target.value)}
                                        className="text-xs min-h-[60px]"
                                    />
                                ) : (lote.details?.address || "-")}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <Building2 className="h-4 w-4" /> Detalhes do Imóvel
                        </h3>
                        <div className="space-y-2 text-muted-foreground text-sm">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="font-medium text-foreground block">Tipo:</span> 
                                    {isEditingDetails ? (
                                        <Input 
                                            value={detailsForm.type || ""} 
                                            onChange={(e) => updateDetail("type", e.target.value)}
                                            className="h-7 text-xs"
                                        />
                                    ) : (lote.details?.type || "-")}
                                </div>
                                <div>
                                    <span className="font-medium text-foreground block">Ocupação:</span> 
                                    {isEditingDetails ? (
                                        <Input 
                                            value={detailsForm.occupancy_status || ""} 
                                            onChange={(e) => updateDetail("occupancy_status", e.target.value)}
                                            className="h-7 text-xs"
                                        />
                                    ) : (lote.details?.occupancy_status || "-")}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="font-medium text-foreground block">Lote:</span> 
                                    {isEditingDetails ? (
                                        <Input 
                                            value={detailsForm.lot || ""} 
                                            onChange={(e) => updateDetail("lot", e.target.value)}
                                            className="h-7 text-xs"
                                        />
                                    ) : (lote.details?.lot || "-")}
                                </div>
                                <div>
                                    <span className="font-medium text-foreground block">Quadra:</span> 
                                    {isEditingDetails ? (
                                        <Input 
                                            value={detailsForm.block || ""} 
                                            onChange={(e) => updateDetail("block", e.target.value)}
                                            className="h-7 text-xs"
                                        />
                                    ) : (lote.details?.block || "-")}
                                </div>
                            </div>
                            <div>
                                <span className="font-medium text-foreground block">Condomínio:</span> 
                                {isEditingDetails ? (
                                    <Input 
                                        value={detailsForm.condominium_name || ""} 
                                        onChange={(e) => updateDetail("condominium_name", e.target.value)}
                                        className="h-7 text-xs"
                                    />
                                ) : (lote.details?.condominium_name || "-")}
                            </div>
                            <div>
                                <span className="font-medium text-foreground block">Loteamento:</span> 
                                {isEditingDetails ? (
                                    <Input 
                                        value={detailsForm.subdivision_name || ""} 
                                        onChange={(e) => updateDetail("subdivision_name", e.target.value)}
                                        className="h-7 text-xs"
                                    />
                                ) : (lote.details?.subdivision_name || "-")}
                            </div>
                            <div>
                                <span className="font-medium text-foreground block">Vagas de Garagem:</span> 
                                {isEditingDetails ? (
                                    <Input 
                                        value={detailsForm.parking_spaces || ""} 
                                        onChange={(e) => updateDetail("parking_spaces", e.target.value)}
                                        className="h-7 text-xs"
                                    />
                                ) : (lote.details?.parking_spaces || "-")}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <Landmark className="h-4 w-4" /> Dados Registrais
                        </h3>
                        <div className="space-y-2 text-muted-foreground text-sm">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="font-medium text-foreground block">Matrícula:</span> 
                                    {isEditingDetails ? (
                                        <Input 
                                            value={detailsForm.registry_id || ""} 
                                            onChange={(e) => updateDetail("registry_id", e.target.value)}
                                            className="h-7 text-xs"
                                        />
                                    ) : (lote.details?.registry_id || "-")}
                                </div>
                                <div>
                                    <span className="font-medium text-foreground block">Cartório:</span> 
                                    {isEditingDetails ? (
                                        <Input 
                                            value={detailsForm.registry_office || ""} 
                                            onChange={(e) => updateDetail("registry_office", e.target.value)}
                                            className="h-7 text-xs"
                                        />
                                    ) : (lote.details?.registry_office || "-")}
                                </div>
                            </div>
                            <div>
                                <span className="font-medium text-foreground block">Inscrição Municipal:</span> 
                                {isEditingDetails ? (
                                    <Input 
                                        value={detailsForm.city_registration_id || ""} 
                                        onChange={(e) => updateDetail("city_registration_id", e.target.value)}
                                        className="h-7 text-xs"
                                    />
                                ) : (lote.details?.city_registration_id || "-")}
                            </div>
                            <div>
                                <span className="font-medium text-foreground block">Fração Ideal:</span> 
                                {isEditingDetails ? (
                                    <Input 
                                        value={detailsForm.ideal_fraction || ""} 
                                        onChange={(e) => updateDetail("ideal_fraction", e.target.value)}
                                        className="h-7 text-xs"
                                    />
                                ) : (lote.details?.ideal_fraction || "-")}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" /> Áreas
                        </h3>
                        <div className="space-y-2 text-muted-foreground text-sm">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="font-medium text-foreground block">Área Privativa:</span> 
                                    {isEditingDetails ? (
                                        <Input 
                                            value={detailsForm.area_private || ""} 
                                            onChange={(e) => updateDetail("area_private", e.target.value)}
                                            className="h-7 text-xs"
                                        />
                                    ) : (lote.details?.area_private || "-")}
                                </div>
                                <div>
                                    <span className="font-medium text-foreground block">Área Total:</span> 
                                    {isEditingDetails ? (
                                        <Input 
                                            value={detailsForm.area_total || ""} 
                                            onChange={(e) => updateDetail("area_total", e.target.value)}
                                            className="h-7 text-xs"
                                        />
                                    ) : (lote.details?.area_total || "-")}
                                </div>
                            </div>
                            <div>
                                <span className="font-medium text-foreground block">Área Terreno:</span> 
                                {isEditingDetails ? (
                                    <Input 
                                        value={detailsForm.area_land || ""} 
                                        onChange={(e) => updateDetail("area_land", e.target.value)}
                                        className="h-7 text-xs"
                                    />
                                ) : (lote.details?.area_land || "-")}
                            </div>
                            <div>
                                <span className="font-medium text-foreground block">Área (Genérica):</span> 
                                {isEditingDetails ? (
                                    <Input 
                                        value={detailsForm.size || ""} 
                                        onChange={(e) => updateDetail("size", e.target.value)}
                                        className="h-7 text-xs"
                                    />
                                ) : (lote.details?.size || "-")}
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
