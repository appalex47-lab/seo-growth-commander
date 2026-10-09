import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pipeline.business_rules import classify, revenue_gap

class BusinessRulesTests(unittest.TestCase):
    def base(self):
        return {'Stock':100,'Posicion_GSC':8,'Volumen_Mercado':100000,'Clicks_GSC':1000,'Conversion_Rate':.03,'AOV':400}
    def test_quick_win(self): self.assertEqual(classify(self.base()), 'QUICK_WIN')
    def test_protect(self):
        p=self.base(); p['Posicion_GSC']=2; self.assertEqual(classify(p),'PROTEGER')
    def test_content_gap(self):
        p=self.base(); p['Posicion_GSC']=30; self.assertEqual(classify(p),'CONTENT_GAP')
    def test_ignore_stock(self):
        p=self.base(); p['Stock']=2; self.assertEqual(classify(p),'IGNORAR')
    def test_revenue_gap(self):
        p=self.base(); self.assertEqual(revenue_gap(p),108000)

if __name__ == '__main__': unittest.main()
