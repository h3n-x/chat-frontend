package app.netlify.chat_zk.app;

import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // HARDWARE-LEVEL SCREENSHOT & SCREEN RECORDING BLOCKING
        // Forces Android's SurfaceFlinger to block Power + Vol Down and black out app previews
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );

        super.onCreate(savedInstanceState);

        // ANTI-FINGERPRINTING: User-Agent Spoofing
        // Replaces device-specific phone identifiers with a generic standard Android profile
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                settings.setUserAgentString("Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36");
            }
        } catch (Exception ignored) {}
    }
}
