
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Gavel, MapPin, Calendar, ExternalLink, Pencil, Save, X } from "lucide-react"
import { BankLogo } from "@/components/BankLogo"

interface GlobalInfoCardProps {
  globalInfo: any
  onUpdate: (newInfo: any) => void
}

export function GlobalInfoCard({ globalInfo, onUpdate }: GlobalInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(globalInfo)

  const handleEdit = () => {
    setFormData(globalInfo)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFormData(globalInfo)
    setIsEditing(false)
  }

  const handleSave = () => {
    onUpdate(formData)
    setIsEditing(false)
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleDateChange = (index: number, value: string) => {
    const newDates = [...(formData.auctionDate || [])]
    newDates[index] = value
    setFormData((prev: any) => ({ ...prev, auctionDate: newDates }))
  }

  const addDate = () => {
    setFormData((prev: any) => ({
      ...prev,
      auctionDate: [...(prev.auctionDate || []), ""]
    }))
  }

  const removeDate = (index: number) => {
    const newDates = [...(formData.auctionDate || [])]
    newDates.splice(index, 1)
    setFormData((prev: any) => ({ ...prev, auctionDate: newDates }))
  }

  if (!globalInfo) return null

  return (
    <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 relative group">
      <div className="absolute top-4 right-4 z-10">
        {!isEditing ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-8 w-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              className="h-8 w-8 text-green-600 hover:text-green-800 hover:bg-green-100"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <CardHeader>
        <CardTitle className="text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
          <Gavel className="h-5 w-5" />
          Informações do Leilão
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bank / Comitente */}
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <BankLogo bankName={formData.bankName} size="md" />
          </div>
          <div className="w-full">
            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Banco / Comitente</p>
            {isEditing ? (
              <Input
                value={formData.bankName || ""}
                onChange={(e) => handleChange("bankName", e.target.value)}
                className="mt-1 bg-white dark:bg-gray-800 h-8"
              />
            ) : (
              <p className="text-base text-indigo-700 dark:text-indigo-300">{globalInfo.bankName}</p>
            )}
          </div>
        </div>

        {/* Auction Date */}
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-1" />
          <div className="w-full">
            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Datas e Horários</p>
            {isEditing ? (
              <div className="flex flex-col gap-2 mt-1">
                {(formData.auctionDate || []).map((date: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={date}
                      onChange={(e) => handleDateChange(idx, e.target.value)}
                      className="bg-white dark:bg-gray-800 h-8 flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDate(idx)}
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={addDate}
                    className="mt-1 h-7 text-xs"
                >
                    Adicionar Data
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-1 mt-1">
                {globalInfo.auctionDate && globalInfo.auctionDate.map((date: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-400 dark:text-indigo-500">•</span>
                    <span className="text-base text-indigo-700 dark:text-indigo-300">{date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Location / Site */}
        <div className="flex items-start gap-3 md:col-span-2">
          <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-1" />
          <div className="w-full">
            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Local / Site</p>
            {isEditing ? (
              <Input
                value={formData.auctionLocation || ""}
                onChange={(e) => handleChange("auctionLocation", e.target.value)}
                className="mt-1 bg-white dark:bg-gray-800 h-8"
              />
            ) : (
              <>
                {globalInfo.auctionLocation && globalInfo.auctionLocation.match(/^(https?:\/\/|www\.)|(\.com|\.br|\.net|\.org)/i) ? (
                  <a
                    href={globalInfo.auctionLocation.startsWith('http') ? globalInfo.auctionLocation : `https://${globalInfo.auctionLocation}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-indigo-700 dark:text-indigo-300 hover:underline flex items-center gap-1"
                  >
                    <span className="truncate">{globalInfo.auctionLocation}</span>
                    <ExternalLink className="h-4 w-4 shrink-0 opacity-50" />
                  </a>
                ) : (
                  <p className="text-base text-indigo-700 dark:text-indigo-300">{globalInfo.auctionLocation}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Auctioneer */}
        <div className="flex items-start gap-3">
          <Gavel className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-1" />
          <div className="w-full">
            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Leiloeiro</p>
            {isEditing ? (
              <Input
                value={formData.auctioneer || ""}
                onChange={(e) => handleChange("auctioneer", e.target.value)}
                className="mt-1 bg-white dark:bg-gray-800 h-8"
              />
            ) : (
              <p className="text-base text-indigo-700 dark:text-indigo-300">{globalInfo.auctioneer}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
