import os,re,uuid
from urllib.parse import urlparse
import httpx
from fastapi import HTTPException

class ZarinpalGateway:
    def __init__(self,mode=None):
        self.mode=mode or os.getenv('ZARINPAL_MODE','sandbox')
        if self.mode not in ('sandbox','live'):raise HTTPException(503,'حالت درگاه معتبر نیست.')
        self.merchant=os.getenv('ZARINPAL_MERCHANT_ID','').strip()
        self.callback=os.getenv('ZARINPAL_CALLBACK_URL','').strip()
        try:uuid.UUID(self.merchant)
        except ValueError:raise HTTPException(503,'شناسه پذیرنده زرین‌پال هنوز تنظیم نشده است.')
        url=urlparse(self.callback)
        if not url.hostname or url.fragment or url.query or url.path!='/api/sales/zarinpal/callback' or url.scheme not in ('https','http') or (self.mode=='live' and url.scheme!='https'):
            raise HTTPException(503,'نشانی بازگشت درگاه هنوز به‌درستی تنظیم نشده است.')
        self.host='https://sandbox.zarinpal.com' if self.mode=='sandbox' else 'https://payment.zarinpal.com'

    def call(self,method,payload):
        try:
            response=httpx.post(f'{self.host}/pg/v4/payment/{method}.json',json={'merchant_id':self.merchant,**payload},timeout=15,follow_redirects=False)
            response.raise_for_status();payload=response.json()
            if not isinstance(payload,dict):raise ValueError()
            data=payload.get('data',{})
            if not isinstance(data,dict):raise ValueError()
            return data
        except (httpx.HTTPError,ValueError):raise HTTPException(502,'پاسخ معتبر از درگاه دریافت نشد؛ سفارش پرداخت‌شده محسوب نمی‌شود.')

    def request(self,order_id,amount):
        data=self.call('request',dict(amount=amount,currency='IRR',callback_url=self.callback,
            description='خرید بلیت گیشو',metadata={'order_id':order_id}))
        authority=data.get('authority','')
        prefix='S' if self.mode=='sandbox' else 'A'
        if data.get('code')!=100 or not isinstance(authority,str) or not re.fullmatch(prefix+r'[a-zA-Z0-9]{35}',authority):
            raise HTTPException(502,'درخواست پرداخت توسط درگاه پذیرفته نشد.')
        return authority

    def verify(self,authority,amount):
        data=self.call('verify',dict(authority=authority,amount=amount))
        ref=data.get('ref_id')
        if data.get('code') not in (100,101) or not isinstance(ref,int) or isinstance(ref,bool) or ref<=0:
            raise HTTPException(502,'پرداخت توسط زرین‌پال تأیید نشد؛ بلیتی صادر نشده است.')
        return str(ref)

    def payment_url(self,authority):return f'{self.host}/pg/StartPay/{authority}'

def gateway_for_mode(mode):return ZarinpalGateway(mode)


def get_gateway():return ZarinpalGateway()
