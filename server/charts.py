import matplotlib.pyplot as plt
from io import BytesIO
import base64

def generate_portfolio_chart(labels, values):
    """Generate a circular chart and return base64 image string"""
    plt.figure(figsize=(4, 4))
    plt.pie(values, labels=labels, autopct='%1.1f%%', startangle=140)
    plt.axis('equal')

    buf = BytesIO()
    plt.savefig(buf, format='png', bbox_inches="tight")
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close()

    return f"data:image/png;base64,{img_base64}"
