from fastapi import APIRouter, HTTPException
router=APIRouter(prefix='/checkout',tags=['مسیر قدیمی خرید'])
@router.post('/process')
def process_checkout():
    raise HTTPException(501,'مسیر قدیمی صدور بلیت بسته شده است. رزرو و سفارش معتبر با تأیید درگاه لازم است.')
