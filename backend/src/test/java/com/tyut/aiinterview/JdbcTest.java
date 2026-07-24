package com.tyut.aiinterview;

import java.sql.Connection;
import java.sql.DriverManager;

public class JdbcTest {
    public static void main(String[] args) throws Exception {
        String[] urls = {
            "jdbc:mysql://localhost:3306/ai_interview?characterEncoding=UTF-8&useSSL=false&allowPublicKeyRetrieval=true",
            "jdbc:mysql://127.0.0.1:3306/ai_interview?characterEncoding=UTF-8&useSSL=false&allowPublicKeyRetrieval=true",
        };
        String[] passwords = {null, ""};
        for (String url : urls) {
            for (String pwd : passwords) {
                try {
                    Connection c = DriverManager.getConnection(url, "root", pwd);
                    System.out.println("OK: " + url + " pwd='" + pwd + "'");
                    c.close();
                } catch (Exception e) {
                    System.out.println("FAIL: " + url + " pwd='" + pwd + "' - " + e.getMessage().split("\n")[0]);
                }
            }
        }
    }
}
