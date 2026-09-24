package com.keuanganku.app;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "PdfPrint")
public class PdfPrintPlugin extends Plugin {

    private static final String TAG = "PdfPrintPlugin";

    @PluginMethod
    public void print(PluginCall call) {
        String path = call.getString("path");
        if (path == null || path.isEmpty()) {
            call.reject("Path berkas PDF tidak boleh kosong");
            return;
        }

        getActivity().runOnUiThread(() -> {
            try {
                Context context = getContext();
                PrintManager printManager = (PrintManager) context.getSystemService(Context.PRINT_SERVICE);
                if (printManager == null) {
                    call.reject("PrintManager tidak tersedia pada perangkat ini");
                    return;
                }

                String jobName = "KeuanganKu Laporan";

                PrintDocumentAdapter adapter = new PrintDocumentAdapter() {
                    @Override
                    public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes,
                                         CancellationSignal cancellationSignal,
                                         LayoutResultCallback callback, Bundle extras) {
                        if (cancellationSignal.isCanceled()) {
                            callback.onLayoutCancelled();
                            return;
                        }
                        PrintDocumentInfo info = new PrintDocumentInfo.Builder("KeuanganKu_Laporan.pdf")
                                .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                                .build();
                        callback.onLayoutFinished(info, true);
                    }

                    @Override
                    public void onWrite(PageRange[] pages, ParcelFileDescriptor destination,
                                        CancellationSignal cancellationSignal,
                                        WriteResultCallback callback) {
                        InputStream in = null;
                        OutputStream out = null;
                        try {
                            if (path.startsWith("content://")) {
                                in = context.getContentResolver().openInputStream(Uri.parse(path));
                            } else {
                                String cleanPath = path;
                                if (cleanPath.startsWith("file://")) {
                                    cleanPath = Uri.parse(cleanPath).getPath();
                                }
                                in = new FileInputStream(new File(cleanPath));
                            }

                            out = new FileOutputStream(destination.getFileDescriptor());

                            byte[] buffer = new byte[8192];
                            int bytesRead;
                            while ((bytesRead = in.read(buffer)) > 0) {
                                if (cancellationSignal.isCanceled()) {
                                    callback.onWriteCancelled();
                                    return;
                                }
                                out.write(buffer, 0, bytesRead);
                            }
                            out.flush();
                            callback.onWriteFinished(new PageRange[]{PageRange.ALL_PAGES});
                        } catch (Exception e) {
                            Log.e(TAG, "Gagal menulis PDF ke PrintDocumentAdapter", e);
                            callback.onWriteFailed(e.getMessage());
                        } finally {
                            try {
                                if (in != null) in.close();
                                if (out != null) out.close();
                            } catch (Exception ignored) {}
                        }
                    }
                };

                printManager.print(jobName, adapter, new PrintAttributes.Builder().build());

                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "Gagal memproses cetak PDF", e);
                call.reject("Gagal memproses cetak PDF: " + e.getMessage());
            }
        });
    }
}
