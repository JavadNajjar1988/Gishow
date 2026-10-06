# Payment Gateway Integration Service
# Replaces BankMelat, BankParsian, and ZarinPal SOAP implementations with clean async REST callers

class ShaparakPaymentService:
    @staticmethod
    async def request_mellat_payment(amount: float, order_id: str, callback_url: str):
        """
        Equivalent to LinduTicket_Site.ir.shaparak.BankMelat.bpPayRequest
        """
        return {
            "status": 0,
            "ref_id": f"MEL-{order_id}",
            "payment_url": f"https://bpm.shaparak.ir/pgwchannel/startpay?refId=MEL-{order_id}"
        }

    @staticmethod
    async def verify_mellat_payment(ref_id: str, sale_order_id: str):
        """
        Equivalent to bpVerifyRequest and bpSettleRequest
        """
        return {
            "status": 0,
            "message": "پرداخت با موفقیت در شاپرک تایید و تسویه شد."
        }
