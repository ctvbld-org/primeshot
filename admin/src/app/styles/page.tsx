import { Tabs, TabsContent, TabsList, TabsTrigger } from '@primeshot/common/web/ui/tabs'
import { StylesTable } from '@/components/styles/styles-table'
import { WardrobesTable } from '@/components/styles/wardrobes-table'
import { ScenesTable } from '@/components/styles/scenes-table'
import { ColorsTable } from '@/components/styles/colors-table'
import styles from './tabs.module.css'

export default function StylesPage() {
  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Styles Management</h1>
        <p className="text-muted-foreground">
          Manage photography styles, wardrobes, scenes, and color options.
        </p>
      </div>

      <Tabs defaultValue="styles" className="space-y-4">
        <TabsList className={styles.tabsList}>
          <TabsTrigger value="styles" className={styles.tabsTrigger}>Styles</TabsTrigger>
          <TabsTrigger value="wardrobes" className={styles.tabsTrigger}>Wardrobes</TabsTrigger>
          <TabsTrigger value="scenes" className={styles.tabsTrigger}>Scenes</TabsTrigger>
          <TabsTrigger value="colors" className={styles.tabsTrigger}>Colors</TabsTrigger>
        </TabsList>

        <TabsContent value="styles" className="space-y-4">
          <StylesTable />
        </TabsContent>

        <TabsContent value="wardrobes" className="space-y-4">
          <WardrobesTable />
        </TabsContent>

        <TabsContent value="scenes" className="space-y-4">
          <ScenesTable />
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <ColorsTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}